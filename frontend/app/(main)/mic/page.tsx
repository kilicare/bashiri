"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic } from "lucide-react";
import { getActiveMicMatches } from "@/lib/api/mic";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function MicHubPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveMicMatches()
      .then((data) => { 
        setItems(data || []); 
        setLoading(false); 
      })
      .catch((error) => {
        console.error("Failed to load mic matches:", error);
        setItems([]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <button onClick={() => router.back()}><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Mic size={20} style={{ color: "#00FF87" }} /> Bashiri Mic
        </h1>
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : items.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna mechi zenye video sasa.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.match.id}
              onClick={() => router.push(`/match/${item.match.id}/mic`)}
              className="w-full text-left rounded-2xl p-4 flex items-center justify-between"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-sm font-bold text-white">{item.match.home_team.name} vs {item.match.away_team.name}</p>
              <span className="text-xs font-bold" style={{ color: "#00FF87" }}>{item.reaction_count} video</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
