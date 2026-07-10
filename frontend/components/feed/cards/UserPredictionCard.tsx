import { ReportButton } from "@/components/report/ReportButton";

export function UserPredictionCard({ cardId, data }: { cardId: number; data: any }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "#F5A623" }}>
          {data.avatar_url ? (
            <img src={data.avatar_url} alt={data.username} className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-black">{data.username?.[0]?.toUpperCase() || "?"}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-white">@{data.username}</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Accuracy: {data.accuracy_percentage}%</p>
        </div>
        {data.emoji && <span className="ml-auto text-xl">{data.emoji}</span>}
      </div>

      {data.match_details && (
        <div className="mb-3 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-bold text-white mb-1">
            {data.match_details.home_team?.name} vs {data.match_details.away_team?.name}
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {data.match_details.league?.name}
          </p>
        </div>
      )}

      <p className="text-sm text-white mb-1">
        Pick: <span className="font-bold">{data.selection}</span> ({data.market})
      </p>
      {data.note && <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>"{data.note}"</p>}
      <div className="mt-2">
        <ReportButton contentType="USER_PREDICTION_CARD" objectId={cardId} />
      </div>
    </div>
  );
}