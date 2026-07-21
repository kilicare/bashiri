"use client";
import { useEffect, useState } from "react";
import { getFeed, Card } from "@/lib/api/feed";
import { CardSkeleton } from "@/components/ui/Skeleton";
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

  async function loadMore(reset = false) {
    const currentOffset = reset ? 0 : offset;
    const data = await getFeed(20, currentOffset);
    setCards((prev) => (reset ? data.results : [...prev, ...data.results]));
    setOffset(currentOffset + 20);
    setHasMore(currentOffset + 20 < data.count);
    setLoading(false);
  }

  useEffect(() => {
    loadMore(true);
    // Poll for updates every 15 seconds
    const interval = setInterval(() => {
      loadMore(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
        {cards.map((card) => (
          <div key={card.id}>{renderCard(card)}</div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => loadMore()}
          className="w-full py-4 text-sm font-medium rounded-2xl mt-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          style={{ color: "var(--brand-primary)", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          Pakia Zaidi
        </button>
      )}
      {showTutorial && <PredictionTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}