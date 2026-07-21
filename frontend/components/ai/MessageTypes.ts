export type MessageType = "text" | "image" | "analysis" | "prediction" | "vision";

export interface BaseMessage {
  id: string;
  role: "user" | "assistant";
  timestamp: string;
  type: MessageType;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  content: string;
  imageUrl: string;
  imageMetadata?: {
    width?: number;
    height?: number;
    size?: number;
  };
}

export interface AnalysisMessage extends BaseMessage {
  type: "analysis";
  content: string;
  analysisData?: {
    title: string;
    sections: Array<{
      title: string;
      content: any;
    }>;
  };
}

export interface PredictionMessage extends BaseMessage {
  type: "prediction";
  content: string;
  predictionData?: {
    prediction: string;
    confidence: number;
    teams?: {
      home: string;
      away: string;
    };
    analysis?: string[];
  };
}

export interface VisionMessage extends BaseMessage {
  type: "vision";
  content: string;
  visionData?: {
    detections: Array<{
      label: string;
      confidence: number;
      value?: string;
    }>;
    analysis: Array<{
      title: string;
      description: string;
      type?: "positive" | "neutral" | "warning";
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      action?: string;
      priority?: "high" | "medium" | "low";
    }>;
  };
}

export type Message = TextMessage | ImageMessage | AnalysisMessage | PredictionMessage | VisionMessage;
