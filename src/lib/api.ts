export const API_BASE = "https://sim.highway.mobi/web";
export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};

// Service token obtained via edge function `highway-auth` (login+password kept server-side).
// Refreshed every ~55 minutes, or on 401, or when missing.
const TOKEN_TTL_MS = 55 * 60 * 1000;
const SERVICE_TOKEN_KEY = "highway_service_token";
const SERVICE_TOKEN_EXP_KEY = "highway_service_token_exp";

let serviceToken: string | null = null;
let serviceTokenExpiresAt = 0;
let inflightAuth: Promise<string> | null = null;

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const loadCachedServiceToken = () => {
  if (serviceToken) return;
  try {
    const t = localStorage.getItem(SERVICE_TOKEN_KEY);
    const exp = Number(localStorage.getItem(SERVICE_TOKEN_EXP_KEY) || 0);
    if (t && exp && Date.now() < exp) {
      serviceToken = t;
      serviceTokenExpiresAt = exp;
    }
  } catch {}
};
loadCachedServiceToken();

const persistServiceToken = (token: string, ttlMs: number) => {
  serviceToken = token;
  serviceTokenExpiresAt = Date.now() + ttlMs;
  try {
    localStorage.setItem(SERVICE_TOKEN_KEY, token);
    localStorage.setItem(SERVICE_TOKEN_EXP_KEY, String(serviceTokenExpiresAt));
  } catch {}
};

const requestNewServiceToken = async (): Promise<string> => {
  if (!SUPABASE_URL) throw new Error("Supabase URL missing");
  const url = `${SUPABASE_URL}/functions/v1/highway-auth`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("highway-auth proxy failed", res.status, txt);
    throw new Error(`Auth proxy error ${res.status}`);
  }
  const json = await res.json();
  const token: string = json.token;
  const expiresIn: number = Number(json.expires_in) || 3600;
  // Refresh a bit before real expiry; cap to TOKEN_TTL_MS.
  const ttlMs = Math.min(TOKEN_TTL_MS, Math.max(60_000, expiresIn * 1000 - 60_000));
  persistServiceToken(token, ttlMs);
  return token;
};

const getServiceToken = async (force = false): Promise<string> => {
  if (!force && serviceToken && Date.now() < serviceTokenExpiresAt) {
    return serviceToken;
  }
  if (inflightAuth) return inflightAuth;
  inflightAuth = requestNewServiceToken().finally(() => {
    inflightAuth = null;
  });
  return inflightAuth;
};

// User token from `api/login` (per-user). Sent as Authorization: Bearer for protected endpoints.
const USER_TOKEN_KEY = "user_token";
let userToken: string | null = null;
try {
  userToken = localStorage.getItem(USER_TOKEN_KEY);
} catch {}

export const getAuthToken = (): string | null => userToken;
export const setAuthToken = (token: string) => {
  userToken = token;
  try { localStorage.setItem(USER_TOKEN_KEY, token); } catch {}
};
export const clearAuthToken = () => {
  serviceToken = null;
  serviceTokenExpiresAt = 0;
  userToken = null;
  try {
    localStorage.removeItem(SERVICE_TOKEN_KEY);
    localStorage.removeItem(SERVICE_TOKEN_EXP_KEY);
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0";
  } catch {}
};

const doFetch = async (path: string, options: RequestInit, serviceTok: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
    "X-API-KEY": serviceTok,
  };
  // Attach user token for protected endpoints, unless caller explicitly disables it.
  if (userToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${userToken}`;
  }
  return fetch(`${API_BASE}/${path}`, { ...options, headers });
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const reqId = Math.random().toString(36).slice(2, 8);
  const method = (options.method || "GET").toUpperCase();
  let reqBody: any = undefined;
  if (options.body && typeof options.body === "string") {
    try { reqBody = JSON.parse(options.body); } catch { reqBody = options.body; }
  }
  console.log(`[HW→ ${reqId}] ${method} ${path}`, reqBody ?? "");

  let token = await getServiceToken();
  let res = await doFetch(path, options, token);

  if (res.status === 401) {
    // Distinguish a stale service token (auth issue) from a business 401
    // like "Not enough funds". Only retry on the former, otherwise the
    // duplicate request can cause side effects on the backend (e.g. queueing
    // a plan change twice).
    let bodyText = "";
    try { bodyText = await res.clone().text(); } catch {}
    let parsed: any = null;
    try { parsed = bodyText ? JSON.parse(bodyText) : null; } catch {}
    const msg = String(parsed?.message || parsed?.error || "").toLowerCase();
    const isBusiness401 =
      msg.includes("not enough") ||
      msg.includes("funds") ||
      msg.includes("balance") ||
      msg.includes("forbidden") ||
      msg.includes("not allowed") ||
      parsed?.success === false;

    if (!isBusiness401) {
      token = await getServiceToken(true);
      res = await doFetch(path, options, token);
    }
  }
  if (!res.ok) {
    let message = `API error ${res.status}`;
    let parsedBody: any = null;
    let rawTxt = "";
    try {
      rawTxt = await res.text();
      try {
        parsedBody = rawTxt ? JSON.parse(rawTxt) : null;
        if (parsedBody && (parsedBody.message || parsedBody.error)) message = parsedBody.message || parsedBody.error;
      } catch {}
    } catch {}
    console.warn(`[HW← ${reqId}] ${res.status} ${method} ${path}`, parsedBody ?? rawTxt);
    const err: any = new Error(message);
    err.status = res.status;
    err.payload = parsedBody;
    throw err;
  }
  const json = await res.json();
  console.log(`[HW← ${reqId}] ${res.status} ${method} ${path}`, json);
  // Some endpoints return 200 with {success:false, message:"..."} — surface as error.
  if (json && json.success === false) {
    const err: any = new Error(json.message || json.error || "Request failed");
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
};

export interface GbPackage {
  id: string;
  size: number;
  price: number | string;
}

export interface PaidPlan {
  id: number;
  name: string;
  local_name: Record<string, string>;
  price: number;
  gb: number;
  gb_roaming: number;
  minutes: number;
  sms: number;
  isFiber: boolean;
  isMobile: boolean;
  services: string[];
  gbPackages?: GbPackage[];
}

export interface Remains {
  gb: number;
  gb_initial: number;
  gb_used: number;
  minutes: number;
  sms: number;
  isFresh: boolean;
}

export interface Subscriber {
  id: number;
  number: string;
  operator: string;
  operator_id: number;
  active: boolean;
  status: string;
  balance: number;
  payment_type: string;
  type: number;
  paid_plan_id: number;
  paid_plan: PaidPlan;
  new_paid_plan: PaidPlan | null;
  remains: Remains;
  parent_id: number | null;
  activation_date: string;
  paymentDay: number;
  new_paid_plan_id: number | null;
  nextPaymentDate: string | null;
  iccid: string;
  contract_number: string | null;
  notifications: number;
}

export interface UserClient {
  id: number;
  status: string;
  first_name: string;
  second_name: string;
  email: string;
  phone: string;
  lang: string;
  passport_number: string;
  second_last_name: string | null;
  balance: number;
  street: string;
  house: string;
  apartment: string;
  postal_code: string;
  city: string;
  subscribers: Subscriber[];
}

export interface UserResponse {
  data: {
    id: number;
    isApp: number;
    client: UserClient;
  };
}

export const fetchUser = (): Promise<UserResponse> => apiFetch("api/user");

export const addGbFromBalance = (subscriberId: number, size: number) =>
  apiFetch("api/addGB", {
    method: "PUT",
    body: JSON.stringify({ subscriber_id: subscriberId, size }),
  });

export interface CheckFundsResult {
  enough: boolean;
  deficit: number; // amount missing in EUR (0 if enough)
  raw?: any;
}

/**
 * Calls api/checkFunds to verify the client has enough balance for an operation.
 * Service examples: "addGB", "ChangePaidPlan".
 * Returns { enough, deficit }. If API call itself errors out (network/etc),
 * caller should handle the thrown error.
 */
export const checkFunds = async (
  service: string,
  price: number,
  subscriberId: number,
  returnUrl = "/success",
  name?: string
): Promise<CheckFundsResult> => {
  try {
    const res = await apiFetch("api/checkFunds", {
      method: "POST",
      body: JSON.stringify({
        data: {
          service,
          price,
          subscriber_id: subscriberId,
          return_url: returnUrl,
          ...(name ? { name } : {}),
        },
      }),
    });
    // Successful response — funds are sufficient
    return { enough: true, deficit: 0, raw: res };
  } catch (err: any) {
    const payload = err?.payload || {};
    const data = payload?.data || {};
    // API may return success:false with deficit info, or simply a "Not enough funds" message.
    const apiDeficit = Number(
      data.deficit ?? data.amount ?? data.missing ?? data.need ?? 0
    );
    const msg = String(err?.message || "").toLowerCase();
    if (apiDeficit > 0 || msg.includes("not enough") || msg.includes("funds") || err?.status === 401) {
      return { enough: false, deficit: apiDeficit, raw: payload };
    }
    if (err?.status === 400) {
      console.warn("checkFunds rejected by API, using local balance fallback", { service, subscriberId, payload, message: err?.message });
      const userRes = await fetchUser();
      const subscriber = userRes.data.client.subscribers?.find((sub) => sub.id === subscriberId);
      const balance = Number(subscriber?.balance ?? 0);
      const deficit = Math.max(0, Number(price) - balance);
      return { enough: deficit <= 0, deficit, raw: payload };
    }
    throw err;
  }
};
