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
      className="w-full text-left rounded-3xl p-5"
      style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(207,175,123,0.08))", border: "1px solid rgba(212,175,55,0.18)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--brand-accent)" }}>
          Result Recap
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{was_correct ? "✅" : "❌"}</span>
          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
            <BarChart3 size={12} />
            <span>Bonyeza kutazama</span>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold text-white mb-1">
        {match.home_team} {match.home_score} - {match.away_score} {match.away_team}
      </p>
      <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
        AI ilisema: <span className="font-medium text-white">{ai_predicted}</span> ({ai_confidence}%) —{" "}
        {was_correct ? "sahihi!" : "hakukuwa sahihi"}
      </p>
      
      {/* Result Analysis */}
      <ResultAnalysis data={data} />
    </button>
  );
}