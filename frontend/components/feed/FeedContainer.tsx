"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { getFeed, Card } from "@/lib/api/feed";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BookButton } from "@/components/ui/BookButton";
import { PredictionTutorial } from "@/components/predictions/PredictionTutorial";
import { AIPickCard } from "./cards/AIPickCard";
import { LiveMatchCard } from "./cards/LiveMatchCard";
import { ResultRecapCard } from "./cards/ResultRecapCard";
import { StatCard } from "./cards/StatCard";
import { PollCard } from "./cards/PollCard";
import { MilestoneCard } from "./cards/MilestoneCard";
import { AIWeeklyReportCard } from "./cards/AIWeeklyReportCard";
import { DidYouKnowCard } from "./cards/DidYouKnowCard";
import { DebateCard } from "./cards/DebateCard";
import { MicWinnerCard } from "./cards/MicWinnerCard";
import { ChevronDown, RefreshCw } from "lucide-react";

function renderCard(card: Card) {
  switch (card.type) {
    case "AI_PICK": return <AIPickCard data={card.data} />;
    case "LIVE_MATCH": return <LiveMatchCard data={card.data} />;
    case "RESULT_RECAP": return <ResultRecapCard matchId={card.match_id} data={card.data} />;
    case "STAT": return <StatCard data={card.data} />;
    case "POLL": return <PollCard cardId={card.id} data={card.data} />;
    case "MILESTONE": return <MilestoneCard data={card.data} />;
    case "AI_WEEKLY_REPORT": return <AIWeeklyReportCard data={card.data} />;
    case "DID_YOU_KNOW": return <DidYouKnowCard data={card.data} />;
    case "DEBATE": return <DebateCard cardId={card.id} data={card.data} />;
    case "MIC_WINNER": return <MicWinnerCard cardId={card.id} data={card.data} />;
    default: return null;
  }
}

export function FeedContainer() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(true);
  
  const feedRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);

  async function loadMore(reset = false) {
    const currentOffset = reset ? 0 : offset;
    const data = await getFeed(20, currentOffset);
    setCards((prev) => (reset ? data.results : [...prev, ...data.results]));
    setOffset(currentOffset + 20);
    setHasMore(currentOffset + 20 < data.count);
    setLoading(false);
  }

  // Smart refresh: append new data without reset
  const smartRefresh = useCallback(async () => {
    // Only refresh if feed is visible and page is active
    if (!isVisible || !isPageVisible) return;
    
    // Debounce: don't refresh if we just refreshed (within 10 seconds)
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 10000) return;
    
    setIsRefreshing(true);
    lastRefreshTimeRef.current = now;
    
    try {
      // Fetch latest items and prepend them if they're new
      const data = await getFeed(10, 0);
      
      setCards(prevCards => {
        const existingIds = new Set(prevCards.map(card => card.id));
        const newCards = data.results.filter(card => !existingIds.has(card.id));
        
        if (newCards.length > 0) {
          return [...newCards, ...prevCards];
        }
        return prevCards;
      });
    } catch (error) {
      console.error('Smart refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isVisible, isPageVisible]);

  // Intersection Observer for visibility detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    if (feedRef.current) {
      observer.observe(feedRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Smart polling with conditions
  useEffect(() => {
    const poll = () => {
      if (isVisible && isPageVisible) {
        smartRefresh();
      }
    };

    // Initial load
    loadMore(true);

    // Set up smart polling (every 30 seconds instead of 15)
    const interval = setInterval(poll, 30000);

    return () => {
      clearInterval(interval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isVisible, isPageVisible]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="mb-8 relative z-10">
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="w-full rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(207,175,123,0.06))",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "var(--text-primary)",
              touchAction: "manipulation"
            }}
          >
            📚 Jifunze kuhusu market predictions
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div ref={feedRef} className="py-6">
      <div className="mb-8 relative z-10">
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="w-full rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(207,175,123,0.06))",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "var(--text-primary)",
            touchAction: "manipulation"
          }}
        >
          📚 Jifunze kuhusu market predictions
        </button>
      </div>
      
      {/* Manual Refresh Button */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={smartRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(207,175,123,0.08))",
            border: "1px solid rgba(212,175,55,0.25)",
            color: "var(--text-primary)",
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Inashaji..." : "Sasisha"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id}>{renderCard(card)}</div>
        ))}
      </div>
      {hasMore && (
        <BookButton onClick={() => loadMore()} icon={ChevronDown}>
          Pakia Zaidi
        </BookButton>
      )}
      {showTutorial && <PredictionTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}