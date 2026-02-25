const API_BASE = "https://sim.highway.mobi/web";

export const getAuthToken = (): string | null => {
  // Try cookie first, then localStorage fallback
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
  if (match && match[1]) return match[1];
  return localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string) => {
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}`;
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

export interface UserClient {
  id: number;
  first_name: string;
  second_name: string;
  email: string;
  phone: string;
  lang: string;
  passport_number: string;
  street: string;
  house: string;
  apartment: string;
  postal_code: string;
  city: string;
  balance: number;
  subscribers: unknown[];
}

export interface UserResponse {
  data: {
    id: number;
    isApp: number;
    client: UserClient;
  };
}

export const fetchUser = (): Promise<UserResponse> => apiFetch("api/user");
