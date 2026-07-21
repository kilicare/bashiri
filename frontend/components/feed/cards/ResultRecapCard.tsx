"use client";
import { useRouter } from "next/navigation";
import { ResultAnalysis } from "./ResultAnalysis";
import { ArrowRight, BarChart3 } from "lucide-react";

export function ResultRecapCard({ matchId, data }: { matchId: number | null; data: any }) {
  const router = useRouter();
  const { match, ai_predicted, ai_confidence, was_correct } = data;

  return (
    <button
      onClick={() => matchId && router.push(`/match/${matchId}/track-record`)}
      className="w-full text-left rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
      style={{ 
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", 
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--brand-accent)" }}>
          Result Recap
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{was_correct ? "✅" : "❌"}</span>
          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.08)", color: "var(--info)" }}>
            <BarChart3 size={12} />
            <span>Bonyeza kutazama</span>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {match.home_team} {match.home_score} - {match.away_score} {match.away_team}
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
        AI ilisema: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{ai_predicted}</span> ({ai_confidence}%) —{" "}
        {was_correct ? "sahihi!" : "hakukuwa sahihi"}
      </p>
      
      {/* Result Analysis */}
      <ResultAnalysis data={data} />
    </button>
  );
}