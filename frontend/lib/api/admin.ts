"use client";
import { useAdminAuthStore } from "@/stores/admin-auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

let adminRefreshPromise: Promise<string | null> | null = null;

async function refreshAdminAccessToken(): Promise<string | null> {
  if (adminRefreshPromise) return adminRefreshPromise;

  const refresh = useAdminAuthStore.getState().refresh;
  if (!refresh) return null;

  adminRefreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        useAdminAuthStore.getState().logout();
        return null;
      }
      const data = await res.json();
      const currentAdmin = useAdminAuthStore.getState().admin;
      if (currentAdmin) {
        useAdminAuthStore.getState().setSession(data.access, refresh, currentAdmin);
      }
      return data.access as string;
    } catch {
      return null;
    } finally {
      adminRefreshPromise = null;
    }
  })();

  return adminRefreshPromise;
}

async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const token = useAdminAuthStore.getState().access;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (res.status === 401 && !_isRetry) {
    const newAccess = await refreshAdminAccessToken();
    if (newAccess) {
      return adminFetch<T>(endpoint, options, true);
    }
    useAdminAuthStore.getState().logout();
    throw new Error("Session ya admin imeisha au huna ruhusa.");
  }

  if (res.status === 403) {
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
  // Login doesn't need auth token, so use direct fetch
  return fetch(`${API_BASE_URL}/dashboard/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, password }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Error ${res.status}`);
    }
    return res.json();
  });
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

export function getTeams() {
  return adminFetch("/dashboard/teams/");
}

export function getMatches(params: { status?: string; league?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.league) query.set("league", params.league);
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

// ============================================================
// LOCAL DERBY MODE MANAGEMENT
// ============================================================
export function getDerbies() {
  return adminFetch("/dashboard/derbies/");
}
export function createDerby(payload: {
  home_team: number;
  away_team: number;
  match?: number | null;
  derby_name: string;
  starts_at: string;
  ends_at: string;
  theme_accent_color: string;
  banner_text: string;
}) {
  return adminFetch("/dashboard/derbies/", { method: "POST", body: JSON.stringify(payload) });
}
export function updateDerby(id: number, payload: any) {
  return adminFetch(`/dashboard/derbies/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}
export function deleteDerby(id: number) {
  return adminFetch(`/dashboard/derbies/${id}/`, { method: "DELETE" });
}

// ============================================================
// DEBATE CARD MANAGEMENT
// ============================================================
export function createDebate(payload: {
  question: string;
  options: string[];
  closes_in_hours: number;
  match_id?: number | null;
}) {
  return adminFetch("/dashboard/debates/", { method: "POST", body: JSON.stringify(payload) });
}
export function resolveDebate(cardId: number, result: string) {
  return adminFetch(`/dashboard/debates/${cardId}/resolve/`, { method: "POST", body: JSON.stringify({ result }) });
}
export function deleteDebate(cardId: number) {
  return adminFetch(`/dashboard/debates/${cardId}/`, { method: "DELETE" });
}
export function getCards(type?: string) {
  const q = type ? `?type=${type}` : "";
  return adminFetch(`/dashboard/cards/${q}`);
}

// ============================================================
// MATCH ROOM MODERATION
// ============================================================
export function hideRoomMessage(messageId: number) {
  return adminFetch(`/dashboard/matchroom-messages/${messageId}/hide/`, { method: "PATCH" });
}

// ============================================================
// BASHIRI MIC MODERATION
// ============================================================
export function getMicReactionsAdmin() {
  return adminFetch("/dashboard/mic-reactions/");
}
export function toggleMicReactionActive(reactionId: number) {
  return adminFetch(`/dashboard/mic-reactions/${reactionId}/toggle/`, { method: "PATCH" });
}

// ============================================================
// SUPPORT SYSTEM
// ============================================================
export function getAdminTickets(params: { status?: string; type?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  return adminFetch(`/dashboard/support/tickets/?${query.toString()}`);
}
export function getAdminTicketDetail(id: number) {
  return adminFetch(`/dashboard/support/tickets/${id}/`);
}
export function replyAdminTicket(id: number, content: string) {
  return adminFetch(`/dashboard/support/tickets/${id}/reply/`, { method: "POST", body: JSON.stringify({ content }) });
}
export function updateTicketStatus(id: number, statusValue: string) {
  return adminFetch(`/dashboard/support/tickets/${id}/`, { method: "PATCH", body: JSON.stringify({ status: statusValue }) });
}
export function getAdminContentReports() {
  return adminFetch("/dashboard/support/content-reports/");
}

export function resetUserPassword(userId: number, newPassword: string) {
  return adminFetch(`/dashboard/users/${userId}/reset-password/`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

// ============================================================
// HERO CAROUSEL MANAGEMENT
// ============================================================
export interface AdminHeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  route: string;
  accent_color: string;
  starts_at: string | null;
  ends_at: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
}

export function getAdminHeroSlides() {
  return adminFetch<AdminHeroSlide[]>("/dashboard/hero-slides/");
}

export function createHeroSlide(payload: Partial<AdminHeroSlide>) {
  return adminFetch<AdminHeroSlide>("/dashboard/hero-slides/", { method: "POST", body: JSON.stringify(payload) });
}

export function updateHeroSlide(id: number, payload: Partial<AdminHeroSlide>) {
  return adminFetch<AdminHeroSlide>(`/dashboard/hero-slides/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteHeroSlide(id: number) {
  return adminFetch(`/dashboard/hero-slides/${id}/`, { method: "DELETE" });
}

interface HeroUploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

export function getHeroImageUploadSignature() {
  return adminFetch<HeroUploadSignature>("/dashboard/hero-slides/upload-signature/");
}

export async function uploadHeroImageToCloudinary(file: File, sig: HeroUploadSignature): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.api_key);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Imeshindwa kupakia picha.");
  const data = await res.json();
  return data.secure_url as string;
}
