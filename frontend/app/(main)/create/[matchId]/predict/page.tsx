"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMatchDashboard, saveMatch, Dashboard } from "@/lib/api/predictions";
import { createUserPrediction } from "@/lib/api/feed";
import { MarketRow } from "@/components/predictions/MarketRow";
import { SubscriptionSheet } from "@/components/predictions/SubscriptionSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Bookmark, Share2 } from "lucide-react";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function PredictDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [note, setNote] = useState("");
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    getMatchDashboard(matchId).then(setDashboard);
  }, [matchId]);

  async function handleSave() {
    if (!requireAuth("Hifadhi mechi zako unazopenda — jisajili sasa!")) return;
    await saveMatch(matchId);
    setSaved(true);
  }

  function openShare() {
    if (!requireAuth("Shiriki mawazo yako na wenzako — jisajili kwa haraka!")) return;
    setShowShare(true);
  }

  async function handleShare(market: string, selection: string) {
    await createUserPrediction({ match: matchId, market, selection, note, emoji: "🔥" });
    setShowShare(false);
    setNote("");
  }

  if (!dashboard) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  const bestMarket = dashboard.markets.find((m) => m.key === "1X2");

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="max-w-2xl mx-auto px-5 pt-safe pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white">
            {dashboard.match.home_team.name} vs {dashboard.match.away_team.name}
          </h1>
          <div className="flex gap-2">
            <button onClick={handleSave} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">
              <Bookmark size={16} style={{ color: saved ? "#00FF87" : "rgba(255,255,255,0.5)" }} fill={saved ? "#00FF87" : "none"} />
            </button>
            <button onClick={openShare} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">
              <Share2 size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </div>
        </div>
      </div>

      <MatchHubTabs matchId={matchId} active="predict" />

      <div className="max-w-2xl mx-auto px-5 pb-8">
        <div className="space-y-3">
          {dashboard.markets.map((market) => (
            <MarketRow key={market.key} market={market} onLockedClick={() => setShowSub(true)} />
          ))}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
          Dixon-Coles Poisson Model v{dashboard.model_version} • Kwa burudani tu — si ushauri wa kamari
        </p>
      </div>

      <SubscriptionSheet isOpen={showSub} onClose={() => setShowSub(false)} />

      {bestMarket && (
        <BottomSheet isOpen={showShare} onClose={() => setShowShare(false)} title="Shiriki Prediction Yako">
          <textarea
            className="w-full rounded-2xl p-3 text-sm text-white bg-[#151515] outline-none mb-3"
            maxLength={150}
            placeholder="Maelezo yako mafupi (hiari)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <BashiriButton className="w-full" onClick={() => handleShare("1X2", bestMarket.ai_pick || "home_win")}>
            Shiriki →
          </BashiriButton>
        </BottomSheet>
      )}
    </DerbyThemeProvider>
  );
}