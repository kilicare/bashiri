/**
 * lib/api/auth.ts
 *
 * OTP flow (requestOTP/verifyOTP) imewekwa chini kama COMMENT.
 */
import { apiClient } from "./client";
import { BashiriUser } from "@/stores/auth.store";

interface AuthResponse {
  access: string;
  refresh: string;
  profile_complete: boolean;
  user: BashiriUser;
}

export function register(payload: {
  phone_number: string;
  password: string;
  confirm_password: string;
  username: string;
  date_of_birth: string;
}) {
  return apiClient<AuthResponse>("/auth/register/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(payload),
  });
}

export function login(phone_number: string, password: string) {
  return apiClient<AuthResponse>("/auth/login/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone_number, password }),
  });
}

export function requestPasswordReset(phone_number: string, message?: string) {
  return apiClient<{ detail: string }>("/auth/request-password-reset/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone_number, message }),
  });
}

export function completeProfile(username: string, date_of_birth: string) {
  return apiClient<BashiriUser>("/auth/complete-profile/", {
    method: "POST",
    body: JSON.stringify({ username, date_of_birth }),
  });
}

export function getMe() {
  return apiClient<BashiriUser>("/auth/me/");
}

export function logoutApi(refresh: string) {
  return apiClient("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) });
}

export function saveOnboardingPreferences(preferences: { favorite_leagues: number[]; favorite_teams?: number[] }) {
  return apiClient<BashiriUser>("/auth/onboarding/", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
}

export function getSettings() {
  return apiClient<{ favorite_leagues: string[]; notifications_enabled: boolean }>("/auth/settings/");
}

export function updateSettings(settings: { favorite_leagues?: string[] }) {
  return apiClient<BashiriUser>("/auth/settings/", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export function updateAvatar(avatar: File) {
  const formData = new FormData();
  formData.append("avatar", avatar);
  
  return apiClient<BashiriUser>("/auth/update-avatar/", {
    method: "POST",
    body: formData,
    skipContentType: true,
  });
}

/*
// ============================================================
// OTP FLOW — IMESIMAMISHWA (commented out, si kufutwa)
// ============================================================
export function requestOTP(phone_number: string) {
  return apiClient<{ detail: string; phone_number: string }>("/auth/request-otp/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone_number }),
  });
}

export function verifyOTP(phone_number: string, code: string) {
  return apiClient<AuthResponse>("/auth/verify-otp/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone_number, code }),
  });
}
*/