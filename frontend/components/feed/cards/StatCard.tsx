export function StatCard({ data }: { data: any }) {
  const { match, home_form, away_form } = data;
  return (
    <div className="rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ 
      background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", 
      border: "1px solid rgba(212,175,55,0.15)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
    }}>
      <span className="text-[10px] font-medium uppercase tracking-wider mb-3 block" style={{ color: "var(--brand-accent)" }}>
        Stat Insight
      </span>
      <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{match.home_team} vs {match.away_team}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{match.home_team}</p>
          <p className="text-lg font-semibold tracking-wider" style={{ color: "var(--brand-accent)" }}>{home_form.sequence}</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Avg goals: {home_form.avg_goals_scored}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{match.away_team}</p>
          <p className="text-lg font-semibold tracking-wider" style={{ color: "var(--warning)" }}>{away_form.sequence}</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Avg goals: {away_form.avg_goals_scored}</p>
        </div>
      </div>
    </div>
  );
}