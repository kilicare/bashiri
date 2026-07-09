"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeagues, getFavoriteLeagues, setFavoriteLeagues } from "@/lib/api/settings";
import { League } from "@/lib/api/predictions";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Check } from "lucide-react";

export default function FavoriteLeaguesPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([getLeagues(), getFavoriteLeagues()]).then(([leaguesData, favData]) => {
      setLeagues(leaguesData);
      setSelected(new Set(favData.league_ids));
      setLoading(false);
    });
  }, []);

  function toggle(leagueId: number) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(leagueId) ? next.delete(leagueId) : next.add(leagueId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await setFavoriteLeagues(Array.from(selected));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <div className="px-5 pt-safe pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Ligi Ninazopenda</h1>
      </div>

      <div className="px-4 space-y-2 pb-20">
        {loading ? [1, 2].map((i) => <CardSkeleton key={i} />) : leagues.map((league) => {
          const isSelected = selected.has(league.id);
          return (
            <button
              key={league.id}
              onClick={() => toggle(league.id)}
              className="w-full rounded-2xl p-4 flex items-center justify-between"
              style={{
                background: isSelected ? "rgba(0,255,135,0.1)" : "#111111",
                border: isSelected ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-sm font-bold text-white">{league.name}</span>
              {isSelected && <Check size={16} style={{ color: "#00FF87" }} />}
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe pb-4 pt-3" style={{ background: "linear-gradient(180deg, transparent, #0A0A0A 30%)" }}>
        <BashiriButton className="w-full" size="lg" loading={saving} onClick={handleSave}>
          {saved ? "Imehifadhiwa ✓" : "Hifadhi"}
        </BashiriButton>
      </div>
    </div>
  );
}
