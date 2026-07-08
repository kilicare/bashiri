export function AIWeeklyReportCard({ data }: { data: any }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(0,255,135,0.2)" }}>
      <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: "#00FF87" }}>
        AI Weekly Report
      </span>
      <p className="text-3xl font-black text-white mb-1">{data.accuracy_percentage}%</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {data.correct_predictions}/{data.total_predictions} sahihi wiki hii
      </p>
    </div>
  );
}