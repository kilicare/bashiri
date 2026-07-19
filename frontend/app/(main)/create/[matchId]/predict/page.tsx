"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMatchDashboard, saveMatch, Dashboard } from "@/lib/api/predictions";
import { MarketRow } from "@/components/predictions/MarketRow";
import { SubscriptionSheet } from "@/components/predictions/SubscriptionSheet";
import { Spinner } from "@/components/ui/Spinner";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Bookmark } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";

export default function PredictDashboardPage() {
  const params = useParams();
  const matchId = Number(params.matchId);
  const { requireAuth } = useRequireAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMatchDashboard(matchId).then(setDashboard);
  }, [matchId]);

  async function handleSave() {
    if (!requireAuth("Ingia ili kuhifadhi mechi hii.")) return;
    setSaving(true);
    try {
      await saveMatch(matchId);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!dashboard) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="px-5 pt-safe pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-black text-white">
            {dashboard.match.home_team.name} vs {dashboard.match.away_team.name}
          </h1>
          <button onClick={handleSave} disabled={saving} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 shrink-0">
            {saving ? (
              <Spinner size={14} color="rgba(255,255,255,0.6)" />
            ) : (
              <Bookmark size={16} style={{ color: saved ? "#00FF87" : "rgba(255,255,255,0.5)" }} fill={saved ? "#00FF87" : "none"} />
            )}
          </button>
        </div>
      </div>

      <MatchHubTabs matchId={matchId} active="predict" />

      <div className="px-5 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dashboard.markets.map((market) => (
            <MarketRow key={market.key} market={market} onLockedClick={() => setShowSub(true)} />
          ))}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
          Dixon-Coles Poisson Model v{dashboard.model_version} • Kwa burudani tu — si ushauri wa kamari
        </p>
      </div>

      <SubscriptionSheet isOpen={showSub} onClose={() => setShowSub(false)} />
    </DerbyThemeProvider>
  );
}