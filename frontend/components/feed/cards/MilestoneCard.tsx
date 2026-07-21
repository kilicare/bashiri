export function MilestoneCard({ data }: { data: any }) {
  return (
    <div className="rounded-3xl p-5 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ 
      background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))", 
      border: "1px solid rgba(212,175,55,0.15)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
    }}>
      <div className="flex items-center justify-center gap-2 mb-3">
        {data.avatar_url ? (
          <img src={data.avatar_url} alt={data.username} className="w-8 h-8 rounded-xl object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-semibold" style={{ background: "var(--brand-primary)", color: "var(--background)" }}>
            {data.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <p className="text-3xl">🔥</p>
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>@{data.username}</p>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{data.message}</p>
    </div>
  );
}