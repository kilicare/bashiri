"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeagues, getTeams, getFavoriteTeams, setFavoriteTeams } from "@/lib/api/settings";
import { League, Team } from "@/lib/api/predictions";
import { BashiriButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Check } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function FavoriteTeamsPage() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teamsByLeague, setTeamsByLeague] = useState<Record<string, Team[]>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!requireAuth("Weka timu unazopenda — jisajili kwa dakika chache!")) {
      router.push("/home");
      return;
    }
    async function load() {
      const [leaguesData, favData] = await Promise.all([getLeagues(), getFavoriteTeams()]);
      if (favData) {
        setLeagues(leaguesData);
        setSelected(new Set(favData.team_ids));

        const teamsMap: Record<string, Team[]> = {};
        for (const league of leaguesData) {
          teamsMap[league.poisson_key] = await getTeams(league.poisson_key);
        }
        setTeamsByLeague(teamsMap);
      }
      setLoading(false);
    }
    load();
  }, [requireAuth, router]);

  function toggle(teamId: number) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(teamId) ? next.delete(teamId) : next.add(teamId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await setFavoriteTeams(Array.from(selected));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-5 pt-safe pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Timu Ninazopenda</h1>
      </div>

      <div className="px-5 space-y-5 pb-24">
        {loading ? (
          [1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : (
          leagues.map((league) => (
            <div key={league.id}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                {league.name}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {(teamsByLeague[league.poisson_key] || []).map((team) => {
                  const isSelected = selected.has(team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => toggle(team.id)}
                      className="rounded-2xl p-3 flex items-center gap-2 text-left"
                      style={{
                        background: isSelected ? "rgba(0,255,135,0.1)" : "#111111",
                        border: isSelected ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="text-xs font-bold text-white flex-1 truncate">{team.name}</span>
                      {isSelected && <Check size={14} style={{ color: "#00FF87" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe pb-4 pt-3" style={{ background: "linear-gradient(180deg, transparent, #0A0A0A 30%)" }}>
        <BashiriButton className="w-full" size="lg" loading={saving} onClick={handleSave}>
          {saved ? "Imehifadhiwa ✓" : "Hifadhi"}
        </BashiriButton>
      </div>
    </div>
  );
}
