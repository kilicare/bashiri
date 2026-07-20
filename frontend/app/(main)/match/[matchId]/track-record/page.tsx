"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getMatchAnalysis, MatchAnalysis } from "@/lib/api/predictions";
import { useAuthStore } from "@/stores/auth.store";
import { AnalysisMarketRow } from "@/components/predictions/AnalysisMarketRow";
import { SubscriptionSheet } from "@/components/predictions/SubscriptionSheet";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function MatchTrackRecordPage() {
  const params = useParams();
  const matchId = Number(params.matchId);
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [error, setError] = useState("");
  const isSubscriptionActive = useAuthStore((s) => s.user?.is_subscription_active ?? false);
  const prevSubscriptionActive = useRef(isSubscriptionActive);

  useEffect(() => {
    getMatchAnalysis(matchId)
      .then(setAnalysis)
      .catch((e) => setError(e.message || "Uchambuzi haupatikani bado."));
  }, [matchId]);

  useEffect(() => {
    if (isSubscriptionActive && !prevSubscriptionActive.current) {
      getMatchAnalysis(matchId).then(setAnalysis).catch(() => {});
    }
    prevSubscriptionActive.current = isSubscriptionActive;
  }, [isSubscriptionActive, matchId]);

  if (error) {
    return (
      <div className="px-5 pt-safe pt-10 text-center">
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{error}</p>
      </div>
    );
  }

  if (!analysis) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  const { ai_scorecard, actual_score, expected_goals, match } = analysis;
  const scoreColor = ai_scorecard.correct >= 6 ? "#00FF87" : ai_scorecard.correct >= 3 ? "#FFD600" : "#FF4757";

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="px-5 pt-safe pt-6 pb-4">
        <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{match.league.name}</p>
        <h1 className="text-xl font-black text-white mb-1">
          {match.home_team.name} {actual_score.home} - {actual_score.away} {match.away_team.name}
        </h1>
      </div>

      <MatchHubTabs matchId={matchId} active="predict" isFinished />

      <div className="px-5 pb-8">
        <div className="rounded-3xl p-6 mb-5 text-center" style={{ background: `${scoreColor}0F`, border: `1px solid ${scoreColor}33` }}>
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: scoreColor }}>Bashiri Track Record</p>
          <p className="text-4xl font-black" style={{ color: scoreColor }}>{ai_scorecard.correct}/{ai_scorecard.total}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Masoko AI Iliyopata Sahihi</p>
        </div>

        <div className="rounded-2xl p-4 mb-5 flex items-center justify-around" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-center">
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>AI Ilitegemea</p>
            <p className="text-lg font-black text-white">{expected_goals.home_xg} - {expected_goals.away_xg}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Halisi</p>
            <p className="text-lg font-black" style={{ color: "#00FF87" }}>{actual_score.home} - {actual_score.away}</p>
          </div>
        </div>

        <div className="space-y-3">
          {analysis.markets.map((market) => (
            <AnalysisMarketRow key={market.key} market={market} onLockedClick={() => setShowSub(true)} />
          ))}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
          Dixon-Coles Poisson Model v{analysis.model_version} • Kwa burudani tu — si ushauri wa kamari
        </p>
      </div>

      <SubscriptionSheet isOpen={showSub} onClose={() => setShowSub(false)} />
    </DerbyThemeProvider>
  );
}
