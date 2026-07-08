export function StatCard({ data }: { data: any }) {
  const { match, home_form, away_form } = data;
  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-[10px] font-black uppercase tracking-widest mb-3 block" style={{ color: "rgba(255,255,255,0.5)" }}>
        Stat Insight
      </span>
      <p className="text-sm font-bold text-white mb-3">{match.home_team} vs {match.away_team}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{match.home_team}</p>
          <p className="text-lg font-black tracking-widest" style={{ color: "#00FF87" }}>{home_form.sequence}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Avg goals: {home_form.avg_goals_scored}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{match.away_team}</p>
          <p className="text-lg font-black tracking-widest" style={{ color: "#FFD600" }}>{away_form.sequence}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Avg goals: {away_form.avg_goals_scored}</p>
        </div>
      </div>
    </div>
  );
}