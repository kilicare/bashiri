"use client";
import { useEffect, useState } from "react";
import { getFeed, Card } from "@/lib/api/feed";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { AIPickCard } from "./cards/AIPickCard";
import { LiveMatchCard } from "./cards/LiveMatchCard";
import { ResultRecapCard } from "./cards/ResultRecapCard";
import { StatCard } from "./cards/StatCard";
import { PollCard } from "./cards/PollCard";
import { UserPredictionCard } from "./cards/UserPredictionCard";
import { MilestoneCard } from "./cards/MilestoneCard";
import { AIWeeklyReportCard } from "./cards/AIWeeklyReportCard";
import { DidYouKnowCard } from "./cards/DidYouKnowCard";
import { DebateCard } from "./cards/DebateCard";
import { MicWinnerCard } from "./cards/MicWinnerCard";

function renderCard(card: Card) {
  switch (card.type) {
    case "AI_PICK": return <AIPickCard data={card.data} />;
    case "LIVE_MATCH": return <LiveMatchCard data={card.data} />;
    case "RESULT_RECAP": return <ResultRecapCard data={card.data} />;
    case "STAT": return <StatCard data={card.data} />;
    case "POLL": return <PollCard cardId={card.id} data={card.data} />;
    case "USER_PREDICTION": return <UserPredictionCard cardId={card.id} data={card.data} />;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.id}>{renderCard(card)}</div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => loadMore()}
          className="w-full py-3 text-sm font-bold rounded-2xl mt-4"
          style={{ color: "#F5A623", background: "rgba(245,166,35,0.06)" }}
        >
          Pakia Zaidi
        </button>
      )}
    </div>
  );
}