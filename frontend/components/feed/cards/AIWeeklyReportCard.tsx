export function AIWeeklyReportCard({ data }: { data: any }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(207,175,123,0.1))", border: "1px solid rgba(212,175,55,0.28)" }}>
      <span className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--brand-primary)" }}>
        AI Weekly Report
      </span>
      <p className="text-3xl font-bold text-white mb-1">{data.accuracy_percentage}%</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {data.correct_predictions}/{data.total_predictions} sahihi wiki hii
      </p>
    </div>
  );
}