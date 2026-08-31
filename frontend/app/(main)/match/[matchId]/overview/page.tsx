"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getMatchOverview } from "@/lib/api/predictions";
import { getTipsByMatch } from "@/lib/api/tips";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { PremiumCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, MessageCircle, TrendingUp, Brain } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { UserTipList } from "@/lib/types/tips";
import { TipCard } from "@/components/tips/TipCard";

const DERBY_TABS = [
  { key: "stats", label: "Derby Stats" },
  { key: "h2h", label: "Head to Head" },
  { key: "poll", label: "Derby Poll" },
  { key: "history", label: "History" },
  { key: "did-you-know", label: "Did You Know" },
];

export default function MatchOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = Number(params.matchId);
  const [data, setData] = useState<any>(null);
  const [tips, setTips] = useState<UserTipList[]>([]);
  const [activeTab, setActiveTab] = useState<string>("stats");
  const { user } = useAuthStore();

  useEffect(() => {
    getMatchOverview(matchId).then(setData);
    getTipsByMatch(matchId).then(response => setTips(response.results || [])).catch(() => setTips([]));
  }, [matchId]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && DERBY_TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (!data) return <div className="px-5 pt-safe pt-6"><CardSkeleton /></div>;

  const { match, home_form, away_form, head_to_head } = data;

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    router.push(`/match/${matchId}/overview?tab=${tabKey}`);
  };

  return (
    <div className="px-5 pt-safe pt-10 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} aria-label="Rudi nyuma">
          <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
      </div>
      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
        {match.league.name}
        {match.stage_display && ` • ${match.stage_display}`}
      </p>
      <h1 className="text-xl font-black text-white mb-5">{match.home_team.name} vs {match.away_team.name}</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {[
          { label: "Overview", href: `/match/${matchId}/overview`, active: true },
          { label: "Predict", href: `/create/${matchId}/predict` },
          { label: "Room", href: `/match/${matchId}/room` },
          { label: "Mic", href: `/match/${matchId}/mic` },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.href)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
            style={{
              background: tab.active ? "var(--brand-accent)" : "rgba(255,255,255,0.06)",
              color: tab.active ? "#000" : "rgba(255,255,255,0.5)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Derby Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {DERBY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start"
            style={{
              background: activeTab === tab.key ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.06)",
              color: activeTab === tab.key ? "var(--brand-primary)" : "rgba(255,255,255,0.5)",
              border: activeTab === tab.key ? "1px solid rgba(212,175,55,0.3)" : "1px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Community Tips Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <PremiumCard variant="gradient" hover className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-blue-400" size={18} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
                Community Tips ({tips.length})
              </p>
            </div>
            {tips.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="text-green-400" size={14} />
                <span className="text-white/70">
                  {tips.filter(t => t.status === 'CORRECT').length} won
                </span>
              </div>
            )}
          </div>
          
          {tips.length === 0 ? (
            <div className="text-center py-6">
              <Brain className="mx-auto mb-2 text-white/30" size={32} />
              <p className="text-sm text-white/50 mb-1">No community tips yet</p>
              <p className="text-xs text-white/30">Be the first to share your prediction</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tips.slice(0, 3).map((tip) => (
                <TipCard key={tip.id} tip={tip} showTeams={false} />
              ))}
              {tips.length > 3 && (
                <button
                  onClick={() => router.push(`/tips?match=${matchId}`)}
                  className="w-full py-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  View all {tips.length} tips →
                </button>
              )}
            </div>
          )}
        </PremiumCard>
      </motion.div>

      {/* Tab Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {activeTab === "stats" && (
          <PremiumCard variant="sand" hover className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Form Guide</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1 text-white">{match.home_team.name}</p>
                <p className="text-lg font-black tracking-widest mb-2" style={{ color: "var(--brand-accent)" }}>{home_form.sequence || "—"}</p>
                {home_form.matches && home_form.matches.length > 0 && (
                  <div className="space-y-1">
                    {home_form.matches.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold ${
                          m.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                          m.result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {m.result}
                        </span>
                        <span className="text-white/60 truncate flex-1">{m.opponent}</span>
                        <span className="text-white/80 font-semibold">{m.team_goals}-{m.opponent_goals}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs mb-1 text-white">{match.away_team.name}</p>
                <p className="text-lg font-black tracking-widest mb-2" style={{ color: "var(--warning)" }}>{away_form.sequence || "—"}</p>
                {away_form.matches && away_form.matches.length > 0 && (
                  <div className="space-y-1">
                    {away_form.matches.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold ${
                          m.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                          m.result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {m.result}
                        </span>
                        <span className="text-white/60 truncate flex-1">{m.opponent}</span>
                        <span className="text-white/80 font-semibold">{m.team_goals}-{m.opponent_goals}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PremiumCard>
        )}

        {activeTab === "h2h" && (
          <PremiumCard variant="gold" hover className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Head to Head</p>
            {head_to_head.length === 0 ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Hakuna historia ya	mechi kati ya timu hizi.</p>
            ) : (
              <div className="space-y-2">
                {head_to_head.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{h.date}</span>
                    <span className="text-white font-bold">{h.home_team} {h.home_score}-{h.away_score} {h.away_team}</span>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        )}

        {activeTab === "poll" && (
          <PremiumCard variant="gradient" hover className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Derby Poll</p>
            <p className="text-sm text-white/70 mb-4">Nani atashinda mechi hii?</p>
            <div className="space-y-3">
              <button className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-sm font-bold text-white">{match.home_team.name}</p>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: "45%", background: "var(--brand-accent)" }}></div>
                </div>
                <p className="text-xs text-white/50 mt-1">45%</p>
              </button>
              <button className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-sm font-bold text-white">{match.away_team.name}</p>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: "35%", background: "var(--brand-primary)" }}></div>
                </div>
                <p className="text-xs text-white/50 mt-1">35%</p>
              </button>
              <button className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-sm font-bold text-white">Sare</p>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: "20%", background: "#FF6B6B" }}></div>
                </div>
                <p className="text-xs text-white/50 mt-1">20%</p>
              </button>
            </div>
          </PremiumCard>
        )}

        {activeTab === "history" && (
          <PremiumCard variant="sand" hover className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Derby History</p>
            {head_to_head.length === 0 ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Hakuna historia ya mechi kati ya timu hizi.</p>
            ) : (
              <div className="space-y-3">
                {head_to_head.slice(0, 5).map((h: any, i: number) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{h.date}</span>
                      <span className={`text-xs font-bold ${h.home_score > h.away_score ? 'text-[var(--success)]' : h.away_score > h.home_score ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
                        {h.home_score > h.away_score ? 'Home Win' : h.away_score > h.home_score ? 'Away Win' : 'Draw'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{h.home_team}</span>
                      <span className="text-lg font-black" style={{ color: "var(--brand-primary)" }}>{h.home_score}-{h.away_score}</span>
                      <span className="text-sm font-bold text-white">{h.away_team}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        )}

        {activeTab === "did-you-know" && (
          <PremiumCard variant="gradient" hover className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Did You Know?</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚽</span>
                <div>
                  <p className="text-sm font-bold text-white mb-1">High Scoring Derby</p>
                  <p className="text-xs text-white/70">Michezo 5 ya mwisho kati ya timu hizi zimepata wastani wa {head_to_head.length > 0 ? Math.round(head_to_head.reduce((acc: number, h: any) => acc + h.home_score + h.away_score, 0) / head_to_head.length) : 2.5} goals.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-bold text-white mb-1">Competitive Rivalry</p>
                  <p className="text-xs text-white/70">Timu hizi zimecheza mara {head_to_head.length} zilizopita, na matokeo yamekuwa ya karibu sana.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-bold text-white mb-1">Derby Atmosphere</p>
                  <p className="text-xs text-white/70">Hii ni moja ya derbies maarufu zaidi, na kila mechi inavuta mashabiki wengi.</p>
                </div>
              </div>
            </div>
          </PremiumCard>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex gap-3">
          <BashiriButton className="flex-1" size="lg" onClick={() => router.push(`/create/${matchId}/predict`)}>
            Ona Predictions →
          </BashiriButton>
          {user && (
            <button
              onClick={() => router.push(`/tips/create/${matchId}`)}
              className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Create Tip
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
