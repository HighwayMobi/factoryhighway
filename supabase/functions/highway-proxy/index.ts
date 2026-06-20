// Highway Mobile API proxy.
// Single entry point for all sim.highway.mobi/web/api/* calls.
// - Caches partner X-API-KEY server-side (never reaches the browser).
// - Forwards the per-user `Authorization: Bearer <user_token>` from the client.
// - Origin whitelist + API path whitelist to prevent abuse.

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^https:\/\/login\.highway\.mobi$/i,
  /^https:\/\/signup\.highway\.mobi$/i,
];

// First path segment of /api/<segment>[/...]. Whitelist derived from grep over src/.
const ALLOWED_PATH_SEGMENTS = new Set<string>([
  "addGB",
  "cancelService",
  "chargeAuto",
  "checkFunds",
  "checkNotifications",
  "checkout",
  "finance",
  "forgotPassword",
  "invoice",
  "lang",
  "login",
  "logout",
  "notifications",
  "paidPlan",
  "paidPlans",
  "readNotification",
  "remains",
  "topUp",
  "user",
]);

const UPSTREAM_ORIGIN = "https://sim.highway.mobi";
const UPSTREAM_PREFIX = "/web/api";
const DEFAULT_TTL_MS = 55 * 60 * 1000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let loginInFlight: Promise<string> | null = null;

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  // Only echo Origin back if it's in our whitelist. Never wildcard.
  const allowOrigin = origin && isOriginAllowed(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, accept",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Expose-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
  };
}

async function loginPartner(): Promise<string> {
  const username = Deno.env.get("HIGHWAY_LOGIN");
  const password = Deno.env.get("HIGHWAY_PASSWORD");
  if (!username || !password) {
    throw new Error("Missing HIGHWAY_LOGIN / HIGHWAY_PASSWORD");
  }

  const res = await fetch(`${UPSTREAM_ORIGIN}${UPSTREAM_PREFIX}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ login: username, password }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Highway login failed: ${res.status} ${text}`);
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Highway login: invalid JSON: ${text}`);
  }

  const token: string | undefined =
    data?.data?.token ??
    data?.token ??
    data?.data?.["X-API-KEY"] ??
    data?.["X-API-KEY"] ??
    data?.access_token ??
    data?.data?.access_token;
  if (!token) {
    throw new Error(`Highway login: token missing in response: ${text}`);
  }

  let ttlMs = DEFAULT_TTL_MS;
  if (typeof data?.expires_in === "number") {
    ttlMs = Math.max(60_000, data.expires_in * 1000 - 60_000);
  }
  cachedToken = token;
  tokenExpiresAt = Date.now() + ttlMs;
  return token;
}

async function getPartnerToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    cachedToken = null;
    tokenExpiresAt = 0;
  }
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (!loginInFlight) {
    loginInFlight = loginPartner().finally(() => {
      loginInFlight = null;
    });
  }
  return await loginInFlight;
}

/** Extract the API path portion after `/highway-proxy`. */
function extractApiPath(req: Request): { segment: string; subPath: string; search: string } | null {
  const url = new URL(req.url);
  const marker = "/highway-proxy";
  const idx = url.pathname.indexOf(marker);
  let subPath = idx >= 0 ? url.pathname.slice(idx + marker.length) : url.pathname;
  if (!subPath.startsWith("/")) subPath = "/" + subPath;
  // Strip optional /web/api or /api prefix
  if (subPath.startsWith("/web/api")) subPath = subPath.slice(8);
  if (subPath.startsWith("/api")) subPath = subPath.slice(4);
  if (!subPath.startsWith("/")) subPath = "/" + subPath;
  // First path segment determines whitelist match
  const seg = subPath.slice(1).split("/")[0]?.split("?")[0] ?? "";
  if (!seg) return null;
  return { segment: seg, subPath, search: url.search };
}

async function forwardToUpstream(
  req: Request,
  partnerToken: string,
  userToken: string | null,
  bodyBuf: ArrayBuffer | null,
  subPath: string,
  search: string,
): Promise<Response> {
  const upstreamUrl = `${UPSTREAM_ORIGIN}${UPSTREAM_PREFIX}${subPath}${search}`;
  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("Content-Type", ct);
  const accept = req.headers.get("accept");
  if (accept) headers.set("Accept", accept);
  headers.set("X-API-KEY", partnerToken);
  if (userToken) headers.set("Authorization", `Bearer ${userToken}`);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD" && bodyBuf && bodyBuf.byteLength > 0) {
    init.body = bodyBuf;
  }
  return await fetch(upstreamUrl, init);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeadersFor(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // 1. Origin check (block anonymous curl / cross-site usage)
  if (!isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: "Forbidden origin" }),
      { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  // 2. Path whitelist
  const parsed = extractApiPath(req);
  if (!parsed || !ALLOWED_PATH_SEGMENTS.has(parsed.segment)) {
    return new Response(
      JSON.stringify({ error: "Forbidden path", path: parsed?.subPath }),
      { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  try {
    // Extract caller's user token (Bearer). Filter out Supabase anon JWT —
    // the client sends anon key via `apikey` header, not Authorization.
    const authHeader = req.headers.get("authorization");
    let userToken: string | null = null;
    if (authHeader && /^Bearer\s+/i.test(authHeader)) {
      const tok = authHeader.replace(/^Bearer\s+/i, "").trim();
      const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (tok && tok !== anon) userToken = tok;
    }

    const bodyBuf =
      req.method === "GET" || req.method === "HEAD"
        ? null
        : await req.arrayBuffer();

    let partnerToken = await getPartnerToken();
    let upstream = await forwardToUpstream(
      req,
      partnerToken,
      userToken,
      bodyBuf,
      parsed.subPath,
      parsed.search,
    );

    // Retry once on 401 with a refreshed partner token (only when the user
    // didn't send a Bearer — a 401 on a user-authenticated call is a real
    // business 401, not a stale partner token).
    if (upstream.status === 401 && !userToken) {
      partnerToken = await getPartnerToken(true);
      upstream = await forwardToUpstream(
        req,
        partnerToken,
        userToken,
        bodyBuf,
        parsed.subPath,
        parsed.search,
      );
    }

    const respHeaders = new Headers(cors);
    const upstreamCt = upstream.headers.get("content-type");
    if (upstreamCt) respHeaders.set("Content-Type", upstreamCt);
    const respBody = await upstream.arrayBuffer();
    return new Response(respBody, { status: upstream.status, headers: respHeaders });
  } catch (err) {
    console.error("highway-proxy error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Proxy error" }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
