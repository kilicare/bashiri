"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDebates, Card } from "@/lib/api/feed";
import { DebateCard } from "@/components/feed/cards/DebateCard";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function DebatesArchivePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [debates, setDebates] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDebates(tab).then((data) => { setDebates(data); setLoading(false); });
  }, [tab]);

  return (
    <div>
      <div className="flex items-center gap-3 px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <button onClick={() => router.back()}><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Debates</h1>
      </div>

      <div className="flex gap-2 px-5 mb-4">
        {(["open", "closed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: tab === t ? "#FF4757" : "rgba(255,255,255,0.06)", color: tab === t ? "#fff" : "rgba(255,255,255,0.5)" }}
          >
            {t === "open" ? "Wazi" : "Zilizofungwa"}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : debates.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna debate hapa.</p>
        ) : (
          debates.map((d) => <DebateCard key={d.id} cardId={d.id} data={d.data} />)
        )}
      </div>
    </div>
  );
}
