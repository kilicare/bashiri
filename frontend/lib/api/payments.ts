import { apiClient } from "./client";

export interface Transaction {
  id: number;
  plan: "weekly" | "monthly";
  amount_tzs: number;
  phone_number: string;
  checkout_request_id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  mpesa_receipt_number: string;
  result_desc: string;
  created_at: string;
}

export function initiateSubscription(plan: "weekly" | "monthly") {
  return apiClient<{ checkout_request_id: string; detail: string }>("/payments/subscribe/", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export function getTransactionStatus(checkoutRequestId: string) {
  return apiClient<Transaction>(`/payments/status/${checkoutRequestId}/`);
}