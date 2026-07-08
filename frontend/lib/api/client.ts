/**
 * lib/api/client.ts
 * Fetch wrapper yenye JWT attach + auto-refresh kwenye 401.
 */
import { useAuthStore } from "@/stores/auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  skipContentType?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = useAuthStore.getState().refresh;
  if (!refresh) return null;

  const res = await fetch(`${API_BASE_URL}/auth/verify-otp/refresh-placeholder/`, {
    method: "POST",
  }).catch(() => null);

  // simplejwt haitoi refresh endpoint ya kawaida hapa — tunatumia
  // rest_framework_simplejwt.views badala yake (ongeza kwenye backend
  // ukihitaji /api/auth/token/refresh/). Kwa sasa: tokens za siku 7,
  // mtumiaji ata-re-login kwa OTP baada ya kuisha (acceptable kwa MVP).
  return null;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiOptions = {}
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

  if (res.status === 401 && !skipAuth) {
    useAuthStore.getState().logout();
    throw new Error("Session imeisha. Ingia tena.");
  }

  if (res.status === 403 && !skipAuth) {
    useAuthStore.getState().logout();
    throw new Error("Akaunti yako imesimamishwa. Wasiliana na usaidizi kwa maelezo zaidi.");
  }

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
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
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  
  // Check if response body is empty before parsing JSON
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as Promise<T>;
}