import { apiClient } from "./client";

export function getNotifications() {
  return apiClient<any[]>("/notifications/");
}
export function markRead(id: number) {
  return apiClient(`/notifications/${id}/read/`, { method: "POST" });
}
export function registerDeviceToken(token: string, platform = "web") {
  return apiClient("/notifications/device-token/", { method: "POST", body: JSON.stringify({ token, platform }) });
}

export interface NotificationPreferences {
  daily_picks_enabled: boolean;
  favorite_team_alerts_enabled: boolean;
  high_confidence_alerts_enabled: boolean;
  result_alerts_enabled: boolean;
}

export function getNotificationPreferences() {
  return apiClient<NotificationPreferences>("/notifications/preferences/");
}
export function updateNotificationPreferences(payload: Partial<NotificationPreferences>) {
  return apiClient<NotificationPreferences>("/notifications/preferences/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}