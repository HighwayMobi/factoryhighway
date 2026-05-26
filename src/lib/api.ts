// All highway.mobi requests go through the `highway-proxy` Supabase Edge
// Function. The partner X-API-KEY lives server-side only — the browser never
// sees it. We still send the per-user token from `api/login` as
// `Authorization: Bearer ...`, and the Supabase anon key as `apikey`.

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const API_BASE = `${SUPABASE_URL ?? ""}/functions/v1/highway-proxy`;
export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};

// User token from `api/login` (per-user). Sent as Authorization: Bearer for protected endpoints.
const USER_TOKEN_KEY = "user_token";
let userToken: string | null = null;
try {
  userToken = localStorage.getItem(USER_TOKEN_KEY);
} catch {}

export const getAuthToken = (): string | null => userToken;

/**
 * Clear all per-user caches kept in session/localStorage so that the next
 * user does not see stale profile/lines/avatar/plan data from the previous one.
 */
const invalidatePerUserCaches = () => {
  try {
    sessionStorage.removeItem("selected_subscriber_id");
    sessionStorage.removeItem("highway:confirmedPlanChange");
    sessionStorage.removeItem("pending_plan_change");
    sessionStorage.removeItem("inapp");
  } catch {}
};

export const setAuthToken = (token: string) => {
  const changed = userToken !== token;
  userToken = token;
  try { localStorage.setItem(USER_TOKEN_KEY, token); } catch {}
  if (changed) invalidatePerUserCaches();
};
export const clearAuthToken = () => {
  userToken = null;
  try {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem("auth_token");
    // Legacy: previous versions stored a partner service token in localStorage.
    localStorage.removeItem("highway_service_token");
    localStorage.removeItem("highway_service_token_exp");
    document.cookie = "auth_token=; path=/; max-age=0";
  } catch {}
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const reqId = Math.random().toString(36).slice(2, 8);
  const method = (options.method || "GET").toUpperCase();
  let reqBody: any = undefined;
  if (options.body && typeof options.body === "string") {
    try { reqBody = JSON.parse(options.body); } catch { reqBody = options.body; }
  }
  console.log(`[HW→ ${reqId}] ${method} ${path}`, reqBody ?? "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (SUPABASE_ANON_KEY && !headers.apikey) headers.apikey = SUPABASE_ANON_KEY;
  if (userToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${userToken}`;
  } else if (!userToken && !headers.Authorization && SUPABASE_ANON_KEY) {
    // The edge function requires *some* Authorization for the functions
    // gateway when verify_jwt is off but the proxy needs the anon key.
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const res = await fetch(`${API_BASE}/${path}`, { ...options, headers });

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
  name?: string,
  extra?: Record<string, any>
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
          ...(extra || {}),
        },
      }),
    });

    const data = (res as any)?.data || {};
    const msg = String((res as any)?.message || "").toLowerCase();
    const apiDeficit = Number(data.amount ?? data.deficit ?? data.missing ?? data.need ?? 0);
    const looksLikePayment =
      msg === "payment" || data.product != null || data.metadata != null || apiDeficit > 0;
    if (looksLikePayment && apiDeficit > 0) {
      return { enough: false, deficit: apiDeficit, raw: res };
    }
    return { enough: true, deficit: 0, raw: res };
  } catch (err: any) {
    const payload = err?.payload || {};
    const data = payload?.data || {};
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
      const raw = userRes.data.client.subscribers as any;
      const list: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const subscriber = list.find((sub) => sub.id === subscriberId);
      const balance = Number(subscriber?.balance ?? 0);
      const deficit = Math.max(0, Number(price) - balance);
      return { enough: deficit <= 0, deficit, raw: payload };
    }
    throw err;
  }
};
