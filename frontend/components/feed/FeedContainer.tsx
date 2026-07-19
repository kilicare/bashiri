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
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-5 md:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.3)] px-5 py-3.5 text-sm font-bold text-white hover:from-[rgba(212,175,55,0.25)] hover:to-[rgba(212,175,55,0.1)] transition-all duration-300 shadow-lg"
          >
            📚 Jifunze kuhusu market predictions
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.3)] px-5 py-3.5 text-sm font-bold text-white hover:from-[rgba(212,175,55,0.25)] hover:to-[rgba(212,175,55,0.1)] transition-all duration-300 shadow-lg"
        >
          📚 Jifunze kuhusu market predictions
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.id}>{renderCard(card)}</div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => loadMore()}
          className="w-full py-3 text-sm font-medium rounded-2xl mt-4"
          style={{ color: "var(--brand-primary)", background: "rgba(212,175,55,0.06)" }}
        >
          Pakia Zaidi
        </button>
      )}
      {showTutorial && <PredictionTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}