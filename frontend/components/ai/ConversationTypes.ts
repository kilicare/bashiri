export type ConversationCategory = "match-analysis" | "betting" | "statistics" | "news" | "general";

export interface Conversation {
  id: string;
  title: string;
  category: ConversationCategory;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isArchived: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  type?: "text" | "image" | "analysis" | "prediction" | "vision";
}

export interface ConversationCreateInput {
  title: string;
  category?: ConversationCategory;
}

export interface ConversationUpdateInput {
  title?: string;
  category?: ConversationCategory;
  isArchived?: boolean;
}
