export function AIWeeklyReportCard({ data }: { data: any }) {
  return (
    <div className="rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ 
      background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", 
      border: "1px solid rgba(212,175,55,0.15)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
    }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider mb-3 block" style={{ color: "var(--brand-accent)" }}>
        AI Weekly Report
      </span>
      <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{data.accuracy_percentage}%</p>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {data.correct_predictions}/{data.total_predictions} sahihi wiki hii
      </p>
    </div>
  );
}