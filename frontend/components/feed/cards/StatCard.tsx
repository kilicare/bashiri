export function StatCard({ data }: { data: any }) {
  const { match, home_form, away_form } = data;
  return (
    <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(207,175,123,0.08))", border: "1px solid rgba(212,175,55,0.24)" }}>
      <span className="text-[10px] font-medium uppercase tracking-widest mb-3 block" style={{ color: "var(--brand-accent)" }}>
        Stat Insight
      </span>
      <p className="text-sm font-semibold text-white mb-3">{match.home_team} vs {match.away_team}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{match.home_team}</p>
          <p className="text-lg font-semibold tracking-widest" style={{ color: "var(--brand-accent)" }}>{home_form.sequence}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Avg goals: {home_form.avg_goals_scored}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{match.away_team}</p>
          <p className="text-lg font-semibold tracking-widest" style={{ color: "var(--warning)" }}>{away_form.sequence}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Avg goals: {away_form.avg_goals_scored}</p>
        </div>
      </div>
    </div>
  );
}