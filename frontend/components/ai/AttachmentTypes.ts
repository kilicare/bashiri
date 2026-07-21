export type AttachmentType = "image" | "document" | "statistics" | "link" | "match";

export interface Attachment {
  id: string;
  type: AttachmentType;
  file?: File;
  url?: string;
  preview?: string;
  name?: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface ImageAttachment extends Attachment {
  type: "image";
  file: File;
  preview: string;
  width?: number;
  height?: number;
}

export interface DocumentAttachment extends Attachment {
  type: "document";
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

export interface StatisticsAttachment extends Attachment {
  type: "statistics";
  data: Record<string, any>;
  source?: string;
}

export interface LinkAttachment extends Attachment {
  type: "link";
  url: string;
  title?: string;
  description?: string;
}

export interface MatchAttachment extends Attachment {
  type: "match";
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
}
