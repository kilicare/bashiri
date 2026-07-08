"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveDerby, ActiveDerby } from "@/lib/api/derby";
import { CardSkeleton } from "@/components/ui/Skeleton";

const HUB_ITEMS = [
  { key: "stats", label: "Derby Stats" },
  { key: "h2h", label: "Head to Head" },
  { key: "poll", label: "Derby Poll" },
  { key: "room", label: "Derby Room" },
  { key: "history", label: "History" },
  { key: "did-you-know", label: "Did You Know" },
];

export default function DerbyHubPage() {
  const router = useRouter();
  const [derby, setDerby] = useState<ActiveDerby | null>(null);

  useEffect(() => {
    getActiveDerby().then((data) => setDerby(data.active ? data : null));
  }, []);

  if (!derby) return <div className="px-4 pt-safe pt-6"><CardSkeleton /></div>;

  return (
    <div style={{ background: `linear-gradient(180deg, ${derby.theme_accent_color}15, #0A0A0A 40%)` }} className="min-h-dvh">
      <div className="px-5 pt-safe pt-6 pb-6 text-center">
        <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: derby.theme_accent_color }}>
          🔥 {derby.derby_name} 🔥
        </p>
        <div className="flex items-center justify-center gap-4 mb-2">
          <p className="text-2xl font-black text-white">{derby.home_team_detail?.name}</p>
          <p className="text-lg" style={{ color: derby.theme_accent_color }}>VS</p>
          <p className="text-2xl font-black text-white">{derby.away_team_detail?.name}</p>
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        {HUB_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => derby.match_id && router.push(`/match/${derby.match_id}/${item.key === "room" ? "room" : "overview"}`)}
            className="rounded-2xl p-4 text-center"
            style={{ background: "#111111", border: `1px solid ${derby.theme_accent_color}33` }}
          >
            <span className="text-sm font-bold text-white">{item.label}</span>
          </button>
        ))}
      </div>

      {derby.head_to_head && derby.head_to_head.length > 0 && (
        <div className="px-4 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Historia</p>
          <div className="space-y-2">
            {derby.head_to_head.map((h: any, i: number) => (
              <div key={i} className="rounded-2xl p-3 flex items-center justify-between text-xs" style={{ background: "#111111" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{h.date}</span>
                <span className="text-white font-bold">{h.home_team} {h.home_score}-{h.away_score} {h.away_team}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}