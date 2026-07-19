"use client";
import { useCallback } from "react";
import { requestPushPermissionAndGetToken } from "@/lib/firebase";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";

export function usePushNotifications() {
  const access = useAuthStore((s) => s.access);

  const enablePush = useCallback(async () => {
    if (!access) return false;
    const token = await requestPushPermissionAndGetToken();
    if (!token) return false;

    await apiClient("/notifications/device-token/", {
      method: "POST",
      body: JSON.stringify({ token, platform: "web" }),
    });
    return true;
  }, [access]);

  return { enablePush };
}
