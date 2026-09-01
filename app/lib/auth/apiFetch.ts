const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

export const ACCESS_TOKEN_KEY = "rkgt-access-token";
export const REFRESH_TOKEN_KEY = "rkgt-refresh-token";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.access) {
          setTokens(json.access, json.refresh);
          return json.access as string;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * A drop-in replacement for `fetch` against this app's API: attaches the
 * bearer token, and on a 401 tries a single silent token refresh + retry
 * before giving up and sending the user back to /login.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401 || !getRefreshToken()) return res;

  const newAccess = await refreshAccessToken();
  if (!newAccess) {
    clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    return res;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${newAccess}`);
  if (init.body && typeof init.body === "string" && !retryHeaders.has("Content-Type")) {
    retryHeaders.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers: retryHeaders });
}
