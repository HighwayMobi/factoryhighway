// Highway Mobile API proxy.
// Прокидывает запросы на https://sim.highway.mobi/web/api/<path>,
// автоматически логинится партнёрскими кредами и кэширует X-API-KEY токен.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, cookie",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "content-type",
};

const UPSTREAM_ORIGIN = "https://sim.highway.mobi";
const UPSTREAM_PREFIX = "/web/api";
const DEFAULT_TTL_MS = 55 * 60 * 1000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let loginInFlight: Promise<string> | null = null;

async function login(): Promise<string> {
  const username = Deno.env.get("HIGHWAY_PARTNER_LOGIN");
  const password = Deno.env.get("HIGHWAY_PARTNER_PASSWORD");
  if (!username || !password) {
    throw new Error("Missing HIGHWAY_PARTNER_LOGIN / HIGHWAY_PARTNER_PASSWORD");
  }

  const res = await fetch(`${UPSTREAM_ORIGIN}${UPSTREAM_PREFIX}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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
    throw new Error(`Highway login: invalid JSON response: ${text}`);
  }

  const token: string | undefined =
    data?.["X-API-KEY"] ??
    data?.data?.["X-API-KEY"] ??
    data?.xApiKey ??
    data?.apiKey ??
    data?.token ??
    data?.data?.token ??
    data?.access_token;
  if (!token) {
    throw new Error(`Highway login: token not found in response: ${text}`);
  }

  let ttlMs = DEFAULT_TTL_MS;
  const expiresAt = data?.expiresAt ?? data?.data?.expiresAt;
  if (expiresAt) {
    const expMs =
      typeof expiresAt === "number"
        ? expiresAt < 1e12
          ? expiresAt * 1000
          : expiresAt
        : Date.parse(expiresAt);
    if (!Number.isNaN(expMs) && expMs > Date.now()) {
      ttlMs = Math.max(60_000, expMs - Date.now() - 60_000);
    }
  } else if (typeof data?.expiresIn === "number") {
    ttlMs = Math.max(60_000, data.expiresIn * 1000 - 60_000);
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + ttlMs;
  return token;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    cachedToken = null;
    tokenExpiresAt = 0;
  }
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (!loginInFlight) {
    loginInFlight = login().finally(() => {
      loginInFlight = null;
    });
  }
  return await loginInFlight;
}

function buildUpstreamUrl(req: Request): string {
  const url = new URL(req.url);
  const marker = "/highway-proxy";
  const idx = url.pathname.indexOf(marker);
  let subPath = idx >= 0 ? url.pathname.slice(idx + marker.length) : url.pathname;
  if (!subPath.startsWith("/")) subPath = "/" + subPath;

  let endpoint = subPath;
  if (endpoint.startsWith("/web/api")) endpoint = endpoint.slice(8);
  if (endpoint.startsWith("/api")) endpoint = endpoint.slice(4);
  if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;

  return `${UPSTREAM_ORIGIN}${UPSTREAM_PREFIX}${endpoint}${url.search}`;
}

async function forward(req: Request, token: string, bodyBuf: ArrayBuffer | null) {
  const upstreamUrl = buildUpstreamUrl(req);

  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("Content-Type", ct);
  const accept = req.headers.get("accept");
  if (accept) headers.set("Accept", accept);
  headers.set("X-API-KEY", token);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD" && bodyBuf && bodyBuf.byteLength > 0) {
    init.body = bodyBuf;
  }

  return await fetch(upstreamUrl, init);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyBuf =
      req.method === "GET" || req.method === "HEAD"
        ? null
        : await req.arrayBuffer();

    let token = await getToken();
    let upstream = await forward(req, token, bodyBuf);

    if (upstream.status === 401) {
      token = await getToken(true);
      upstream = await forward(req, token, bodyBuf);
    }

    const respHeaders = new Headers(corsHeaders);
    const upstreamCt = upstream.headers.get("content-type");
    if (upstreamCt) respHeaders.set("Content-Type", upstreamCt);

    const respBody = await upstream.arrayBuffer();
    return new Response(respBody, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    console.error("highway-proxy error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Proxy error" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
