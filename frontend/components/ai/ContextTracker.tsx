"use client";

import { useState, useEffect } from "react";

interface ContextItem {
  id: string;
  type: "match" | "team" | "player" | "market" | "topic";
  value: string;
  timestamp: string;
}

interface ConversationContext {
  currentMatch?: string;
  currentTeams?: string[];
  currentMarket?: string;
  topics: ContextItem[];
}

export class ContextTracker {
  private context: ConversationContext = {
    topics: [],
  };

  addContext(item: Omit<ContextItem, "id" | "timestamp">) {
    const contextItem: ContextItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    this.context.topics.push(contextItem);

    // Update specific context fields
    if (item.type === "match") {
      this.context.currentMatch = item.value;
    }

    // Keep only last 10 context items
    if (this.context.topics.length > 10) {
      this.context.topics = this.context.topics.slice(-10);
    }
  }

  getContext(): ConversationContext {
    return this.context;
  }

  getRecentContext(count: number = 3): ContextItem[] {
    return this.context.topics.slice(-count);
  }

  hasContext(type: string, value?: string): boolean {
    return this.context.topics.some(
      (item) => item.type === type && (!value || item.value === value)
    );
  }

  clearContext() {
    this.context = {
      topics: [],
    };
  }
}

export function useContextTracker() {
  const [tracker] = useState(() => new ContextTracker());
  const [context, setContext] = useState<ConversationContext>(tracker.getContext());

  const addContext = (item: Omit<ContextItem, "id" | "timestamp">) => {
    tracker.addContext(item);
    setContext(tracker.getContext());
  };

  const clearContext = () => {
    tracker.clearContext();
    setContext(tracker.getContext());
  };

  return {
    context,
    addContext,
    clearContext,
    getContext: () => tracker.getContext(),
    getRecentContext: (count?: number) => tracker.getRecentContext(count),
    hasContext: (type: string, value?: string) => tracker.hasContext(type, value),
  };
}
