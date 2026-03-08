const API_BASE = "https://sim.highway.mobi/web";

export const getAuthToken = (): string | null => {
  // Try cookie first, then localStorage fallback
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
  if (match && match[1]) return match[1];
  return localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string) => {
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 10}`;
  localStorage.setItem("auth_token", token);
};

export const clearAuthToken = () => {
  document.cookie = "auth_token=; path=/; max-age=0";
  localStorage.removeItem("auth_token");
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
};

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
  services: unknown[];
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
  subscribers: Subscriber;
}

export interface UserResponse {
  data: {
    id: number;
    isApp: number;
    client: UserClient;
  };
}

export const fetchUser = (): Promise<UserResponse> => apiFetch("api/user");
