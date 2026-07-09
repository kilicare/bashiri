import { apiClient } from "./client";

export function submitContentReport(payload: {
  content_type: "MIC_REACTION" | "USER_PREDICTION_CARD" | "ROOM_MESSAGE";
  object_id: number;
  reason: string;
  note?: string;
}) {
  return apiClient("/support/reports/", { method: "POST", body: JSON.stringify(payload) });
}
