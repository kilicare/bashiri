export function MilestoneCard({ data }: { data: any }) {
  return (
    <div className="rounded-3xl p-5 text-center" style={{ background: "rgba(255,214,0,0.06)", border: "1px solid rgba(255,214,0,0.2)" }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        {data.avatar_url ? (
          <img src={data.avatar_url} alt={data.username} className="w-8 h-8 rounded-xl object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-black" style={{ background: "#FFD54A" }}>
            {data.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <p className="text-3xl">🔥</p>
      </div>
      <p className="text-sm font-bold text-white">@{data.username}</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{data.message}</p>
    </div>
  );
}