"use client";
import { useAdminAuthStore } from "@/stores/admin-auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function adminFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAdminAuthStore.getState().access;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (res.status === 401 || res.status === 403) {
    useAdminAuthStore.getState().logout();
    throw new Error("Session ya admin imeisha au huna ruhusa.");
  }

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function adminLogin(phone_number: string, password: string) {
  return adminFetch("/dashboard/login/", { method: "POST", body: JSON.stringify({ phone_number, password }) });
}

export function getDashboardStats() {
  return adminFetch("/dashboard/stats/");
}

export function getUsers(params: { search?: string; is_subscriber?: boolean; is_active?: boolean; offset?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.is_subscriber !== undefined) query.set("is_subscriber", String(params.is_subscriber));
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
  if (params.offset) query.set("offset", String(params.offset));
  return adminFetch(`/dashboard/users/?${query.toString()}`);
}

export function getUserDetail(id: number) {
  return adminFetch(`/dashboard/users/${id}/`);
}
export function updateUser(id: number, payload: { is_active?: boolean; is_staff?: boolean }) {
  return adminFetch(`/dashboard/users/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}
export function deleteUser(id: number) {
  return adminFetch(`/dashboard/users/${id}/`, { method: "DELETE" });
}
export function getUserPredictions(id: number) {
  return adminFetch(`/dashboard/users/${id}/predictions/`);
}

export function getMatches(params: { status?: string; league?: string } = {}) {
  const query = new URLSearchParams(params as Record<string, string>);
  return adminFetch(`/dashboard/matches/?${query.toString()}`);
}
export function updateMatch(id: number, payload: any) {
  return adminFetch(`/dashboard/matches/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function getTransactions(params: { status?: string; offset?: number } = {}) {
  const query = new URLSearchParams(params as any);
  return adminFetch(`/dashboard/transactions/?${query.toString()}`);
}
export function manualActivateSubscription(payload: { user_id: number; plan: string; reason: string }) {
  return adminFetch("/dashboard/transactions/manual-activate/", { method: "POST", body: JSON.stringify(payload) });
}

export function broadcastNotification(payload: { title: string; body: string; segment: string }) {
  return adminFetch("/dashboard/notifications/broadcast/", { method: "POST", body: JSON.stringify(payload) });
}

export function getMLStatus() {
  return adminFetch("/dashboard/ml-status/");
}

export function getActionLog() {
  return adminFetch("/dashboard/action-log/");
}
