"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMatchOverview } from "@/lib/api/predictions";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { PremiumCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export default function MatchOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getMatchOverview(matchId).then(setData);
  }, [matchId]);

  if (!data) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  const { match, home_form, away_form, head_to_head } = data;

  return (
    <div className="px-5 pt-safe pt-6 pb-6">
      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{match.league.name}</p>
      <h1 className="text-xl font-black text-white mb-5">{match.home_team.name} vs {match.away_team.name}</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {[
          { label: "Overview", href: `/create/${matchId}/overview`, active: true },
          { label: "Predict", href: `/create/${matchId}/predict` },
          { label: "Room", href: `/match/${matchId}/room` },
          { label: "Mic", href: `/match/${matchId}/mic` },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.href)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
            style={{
              background: tab.active ? "#00FF87" : "rgba(255,255,255,0.06)",
              color: tab.active ? "#000" : "rgba(255,255,255,0.5)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <PremiumCard variant="purple" hover className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Form Guide</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1 text-white">{match.home_team.name}</p>
              <p className="text-lg font-black tracking-widest mb-2" style={{ color: "#00FF87" }}>{home_form.sequence || "—"}</p>
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
              <p className="text-lg font-black tracking-widest mb-2" style={{ color: "#FFD600" }}>{away_form.sequence || "—"}</p>
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
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <PremiumCard variant="gold" hover className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Head to Head</p>
          {head_to_head.length === 0 ? (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Hakuna historia ya mechi kati ya timu hizi.</p>
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
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <BashiriButton className="w-full" size="lg" onClick={() => router.push(`/create/${matchId}/predict`)}>
          Ona Predictions →
        </BashiriButton>
      </motion.div>
    </div>
  );
}