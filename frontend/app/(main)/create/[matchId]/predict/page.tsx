"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMatchDashboard, saveMatch, saveMarket, unsaveMarket, getSavedMarkets, Dashboard } from "@/lib/api/predictions";
import { useAuthStore } from "@/stores/auth.store";
import { MarketRow } from "@/components/predictions/MarketRow";
import { TopPickCard } from "@/components/predictions/TopPickCard";
import { ConfidenceLegend } from "@/components/predictions/ConfidenceLegend";
import { SubscriptionSheet } from "@/components/predictions/SubscriptionSheet";
import { Spinner } from "@/components/ui/Spinner";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Bookmark, CheckSquare, Square, ArrowRight, ArrowLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { MatchHubTabs } from "@/components/match-hub/MatchHubTabs";
import { DerbyThemeProvider } from "@/components/match-hub/DerbyThemeProvider";
import { usePWAInstallStore } from "@/stores/pwaInstall.store";

export default function PredictDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);
  const { requireAuth } = useRequireAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMarkets, setSavedMarkets] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const isSubscriptionActive = useAuthStore((s) => s.user?.is_subscription_active ?? false);
  const prevSubscriptionActive = useRef(isSubscriptionActive);

  useEffect(() => {
    getMatchDashboard(matchId).then(setDashboard);
    loadSavedMarkets();
  }, [matchId]);

  useEffect(() => {
    if (isSubscriptionActive && !prevSubscriptionActive.current) {
      getMatchDashboard(matchId).then(setDashboard).catch(() => {});
    }
    prevSubscriptionActive.current = isSubscriptionActive;
  }, [isSubscriptionActive, matchId]);

  async function loadSavedMarkets() {
    try {
      const markets = await getSavedMarkets(matchId);
      setSavedMarkets(new Set(markets.map((m: any) => m.market_key)));
    } catch (error) {
      // User might not be logged in
    }
  }

  async function handleSave() {
    if (!requireAuth("Ingia ili kuhifadhi mechi hii.")) return;
    setSaving(true);
    try {
      await saveMatch(matchId);
      setSaved(true);
      usePWAInstallStore.getState().attemptShow();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMarket(marketKey: string) {
    if (!requireAuth("Ingia ili kuhifadhi soko hili.")) return;
    try {
      await saveMarket(matchId, marketKey);
      setSavedMarkets(prev => new Set([...prev, marketKey]));
    } catch (error) {
      console.error("Failed to save market:", error);
    }
  }

  async function handleUnsaveMarket(marketKey: string) {
    try {
      await unsaveMarket(matchId, marketKey);
      setSavedMarkets(prev => {
        const newSet = new Set(prev);
        newSet.delete(marketKey);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to unsave market:", error);
    }
  }

  function toggleMarketSelection(marketKey: string) {
    setSelectedMarkets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(marketKey)) {
        newSet.delete(marketKey);
      } else {
        newSet.add(marketKey);
      }
      return newSet;
    });
  }

  async function handleBulkSave() {
    if (!requireAuth("Ingia ili kuhifadhi masoko yaliyochaguliwa.")) return;
    setBulkSaving(true);
    try {
      for (const marketKey of selectedMarkets) {
        await saveMarket(matchId, marketKey);
      }
      setSavedMarkets(prev => new Set([...prev, ...selectedMarkets]));
      setSelectedMarkets(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to bulk save markets:", error);
    } finally {
      setBulkSaving(false);
    }
  }

  if (!dashboard) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;
  const isFinished = dashboard.match.status === "FINISHED";

  return (
    <DerbyThemeProvider matchId={matchId}>
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} aria-label="Rudi nyuma">
              <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
            <h1 className="text-xl font-black text-white">
              {dashboard.match.home_team.name} vs {dashboard.match.away_team.name}
            </h1>
          </div>
          <button 
            onClick={() => router.push('/saved-markets')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 shrink-0 transition-all hover:bg-white/10"
          >
            <Bookmark size={16} style={{ color: "#D4AF37" }} />
            <span className="text-xs font-bold" style={{ color: "#D4AF37" }}>Saved Markets</span>
            <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
      </div>

      <MatchHubTabs matchId={matchId} active="predict" isFinished={isFinished} />

      <div className="px-5 pb-8">
        <TopPickCard topPick={dashboard.top_pick} onLockedClick={() => setShowSub(true)} />

        {/* Multi-selection controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectionMode(!selectionMode)}
            className="text-sm font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ 
              background: selectionMode ? "rgba(212, 175, 55, 0.2)" : "rgba(255,255,255,0.05)",
              color: selectionMode ? "#D4AF37" : "rgba(255,255,255,0.6)",
              border: selectionMode ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)"
            }}
          >
            {selectionMode ? "Cancel Selection" : "Select Markets"}
          </button>
          
          {selectionMode && selectedMarkets.size > 0 && (
            <button
              onClick={handleBulkSave}
              disabled={bulkSaving}
              className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-2"
              style={{ 
                background: bulkSaving ? "rgba(212, 175, 55, 0.1)" : "#D4AF37",
                color: bulkSaving ? "rgba(212, 175, 55, 0.5)" : "#000"
              }}
            >
              {bulkSaving ? (
                <Spinner size={12} color="#D4AF37" />
              ) : (
                <Bookmark size={14} fill="currentColor" />
              )}
              Save {selectedMarkets.size} Market{selectedMarkets.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dashboard.markets.map((market) => (
            <MarketRow 
              key={market.key}
              market={market} 
              onLockedClick={() => setShowSub(true)}
              matchId={matchId}
              isSaved={savedMarkets.has(market.key)}
              onSave={handleSaveMarket}
              onUnsave={handleUnsaveMarket}
              selectionMode={selectionMode}
              isSelected={selectedMarkets.has(market.key)}
              onToggleSelection={toggleMarketSelection}
            />
          ))}
        </div>

        <div className="mt-5">
          <ConfidenceLegend />
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
          Dixon-Coles Poisson Model v{dashboard.model_version} • Kwa burudani tu — si ushauri wa kamari
        </p>
      </div>

      <SubscriptionSheet isOpen={showSub} onClose={() => setShowSub(false)} />
    </DerbyThemeProvider>
  );
}