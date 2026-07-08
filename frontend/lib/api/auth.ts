import { apiClient } from "./client";
import { BashiriUser } from "@/stores/auth.store";

export function requestOTP(phone_number: string) {
  return apiClient<{ detail: string; phone_number: string }>("/auth/request-otp/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone_number }),
  });
}

export function verifyOTP(phone_number: string, code: string) {
  return apiClient<{
    access: string;
    refresh: string;
    profile_complete: boolean;
    user: BashiriUser;
  }>("/auth/verify-otp/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone_number, code }),
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

export function saveOnboardingPreferences(preferences: { favorite_leagues: number[] }) {
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