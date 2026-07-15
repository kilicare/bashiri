import { ResultAnalysis } from "./ResultAnalysis";

export function ResultRecapCard({ data }: { data: any }) {
  const { match, ai_predicted, ai_confidence, was_correct } = data;
  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
          Result Recap
        </span>
        <span className="text-lg">{was_correct ? "✅" : "❌"}</span>
      </div>
      <p className="text-sm font-bold text-white mb-1">
        {match.home_team} {match.home_score} - {match.away_score} {match.away_team}
      </p>
      <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
        AI ilisema: <span className="font-bold text-white">{ai_predicted}</span> ({ai_confidence}%) —{" "}
        {was_correct ? "sahihi!" : "hakukuwa sahihi"}
      </p>
      
      {/* Result Analysis */}
      <ResultAnalysis data={data} />
    </div>
  );
}