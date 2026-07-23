/**
 * lib/api/client.ts
 * Fetch wrapper yenye JWT attach + auto-refresh HALISI kwenye 401.
 */
import { useAuthStore } from "@/stores/auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  skipContentType?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise; // epuka refresh nyingi zinazoshindana

  const refresh = useAuthStore.getState().refresh;
  if (!refresh) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        useAuthStore.getState().logout();
        return null;
      }
      const data = await res.json();
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setSession(data.access, refresh, currentUser);
      }
      return data.access as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiOptions = {},
  _isRetry = false
): Promise<T> {
  const { skipAuth, skipContentType, headers, ...rest } = options;
  const token = useAuthStore.getState().access;

  const finalHeaders: Record<string, string> = {};
  
  if (!skipContentType) {
    finalHeaders["Content-Type"] = "application/json";
  }
  
  Object.assign(finalHeaders, headers as Record<string, string>);

  if (token && !skipAuth) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (res.status === 401 && !skipAuth && !_isRetry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiClient<T>(endpoint, options, true); // jaribu MARA MOJA tena
    }
    // Guest users (hakuna token) - return null instead of throwing error
    if (!token) {
      return null as T;
    }
    throw new Error("Session imeisha. Ingia tena.");
  }

  if (res.status === 403 && !skipAuth) {
    useAuthStore.getState().logout();
    throw new Error("Akaunti yako imesimamishwa. Wasiliana na usaidizi kwa maelezo zaidi.");
  }

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const text = await res.text();
      // Check if response is HTML (Django error page)
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        console.error('[API Error HTML]', endpoint, res.status, 'Backend returned HTML error page');
        detail = `Server error (${res.status}). Backend returned HTML error page instead of JSON. Check backend logs.`;
      } else {
        try {
          const body = JSON.parse(text);
          console.error('[API Error]', endpoint, res.status, body);
          // Handle Django REST Framework error format: { "field": ["error message"] }
          if (body.detail) {
            detail = body.detail;
          } else if (typeof body === 'object') {
            // Extract first error message from any field
            const firstKey = Object.keys(body)[0];
            if (firstKey && Array.isArray(body[firstKey])) {
              detail = body[firstKey][0];
            } else if (firstKey && typeof body[firstKey] === 'string') {
              detail = body[firstKey];
            } else {
              detail = JSON.stringify(body);
            }
          } else {
            detail = JSON.stringify(body);
          }
        } catch (jsonError) {
          console.error('[API Parse Error]', jsonError);
          detail = `Error ${res.status} - ${text.substring(0, 200)}`;
        }
      }
    } catch (e) {
      console.error('[API Error Exception]', e);
      detail = `Error ${res.status} - Server error occurred`;
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  
  // Check if response body is empty before parsing JSON
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as Promise<T>;
}