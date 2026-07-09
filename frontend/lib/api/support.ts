import { apiClient } from "./client";

export interface SupportMessage {
  id: number;
  sender_type: "USER" | "ADMIN";
  sender_username: string | null;
  content: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  type: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  related_content_type: string;
  related_object_id: number | null;
  messages: SupportMessage[];
}

export function getMyTickets() {
  return apiClient<SupportTicket[]>("/support/tickets/");
}

export function createTicket(payload: { type: string; subject: string; message: string }) {
  return apiClient<SupportTicketDetail>("/support/tickets/", { method: "POST", body: JSON.stringify(payload) });
}

export function getTicketDetail(id: number) {
  return apiClient<SupportTicketDetail>(`/support/tickets/${id}/`);
}

export function replyToTicket(id: number, content: string) {
  return apiClient<SupportTicketDetail>(`/support/tickets/${id}/reply/`, { method: "POST", body: JSON.stringify({ content }) });
}
