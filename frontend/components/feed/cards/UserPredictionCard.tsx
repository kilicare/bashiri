import { ReportButton } from "@/components/report/ReportButton";

export function UserPredictionCard({ cardId, data }: { cardId: number; data: any }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-black" style={{ background: "#00FF87" }}>
          {data.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-bold text-white">@{data.username}</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Accuracy: {data.accuracy_percentage}%</p>
        </div>
        {data.emoji && <span className="ml-auto text-xl">{data.emoji}</span>}
      </div>

      <p className="text-sm text-white mb-1">
        Pick: <span className="font-bold">{data.selection}</span> ({data.market})
      </p>
      {data.note && <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>"{data.note}"</p>}

      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-full"
          style={{
            background: data.matched_ai_pick ? "rgba(0,255,135,0.1)" : "rgba(255,214,0,0.1)",
            color: data.matched_ai_pick ? "#00FF87" : "#FFD600",
          }}
        >
          {data.matched_ai_pick ? "🤖 Alikubaliana na AI" : "🎯 Prediction Yake Mwenyewe"}
        </span>
        <ReportButton contentType="USER_PREDICTION_CARD" objectId={cardId} />
      </div>
    </div>
  );
}