"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PremiumButton } from "@/components/ui/Button";
import { getMe, saveOnboardingPreferences } from "@/lib/api/auth";
import { getFavoriteLeagues, getFavoriteTeams, getLeagues, getTeams } from "@/lib/api/settings";
import { League, Team } from "@/lib/api/predictions";
import { useAuthStore } from "@/stores/auth.store";
import { consumeReturnTo } from "@/lib/return-to";

type Step = 0 | 1 | 2 | 3 | 4;
type TipPreference = "high_confidence" | "hot_tips" | "best_value" | "top_tipsters" | "all_tips";
type Draft = { step: Step; leagues: number[]; teams: number[]; preferences: TipPreference[] };

const DRAFT_KEY = "bashiri-onboarding-draft";
const emptyDraft: Draft = { step: 0, leagues: [], teams: [], preferences: [] };
const tipOptions: Array<{ key: TipPreference; title: string; description: string }> = [
  { key: "high_confidence", title: "High Confidence", description: "Show the strongest statistical signals first." },
  { key: "hot_tips", title: "Hot Tips", description: "Keep an eye on tipsters in good recent form." },
  { key: "best_value", title: "Best Value", description: "Surface opportunities where the numbers stand out." },
  { key: "top_tipsters", title: "Top Tipsters", description: "Follow proven analysts and their latest tips." },
  { key: "all_tips", title: "All Tips", description: "Keep the full tips experience in view." },
];

function readDraft(): Draft {
  if (typeof window === "undefined") return emptyDraft;
  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return emptyDraft;
  try { return { ...emptyDraft, ...JSON.parse(saved) }; } catch { sessionStorage.removeItem(DRAFT_KEY); return emptyDraft; }
}

export default function OnboardingPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [draft, setDraft] = useState<Draft>(readDraft);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagueQuery, setLeagueQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMe(), getLeagues(), getTeams(), getFavoriteLeagues(), getFavoriteTeams()])
      .then(([user, leagueData, teamData, favoriteLeagueData, favoriteTeamData]) => {
        setUser(user);
        if (user.onboarding_status !== "not_started") { router.replace(consumeReturnTo() || "/home"); return; }
        setLeagues(leagueData);
        setTeams(teamData);
        setDraft((current) => ({
          ...current,
          leagues: Array.from(new Set([...favoriteLeagueData.league_ids, ...current.leagues])),
          teams: Array.from(new Set([...favoriteTeamData.team_ids, ...current.teams])),
        }));
      })
      .catch(() => setError("We could not load your options. Please try again."))
      .finally(() => setLoading(false));
  }, [router, setUser]);

  useEffect(() => { if (!loading) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }, [draft, loading]);

  const visibleLeagues = useMemo(() => leagues.filter((league) => league.name.toLowerCase().includes(leagueQuery.toLowerCase())), [leagueQuery, leagues]);
  const visibleTeams = useMemo(() => {
    const selectedFirst = teams.filter((team) => draft.leagues.includes(team.league?.id ?? -1));
    const remaining = teams.filter((team) => !draft.leagues.includes(team.league?.id ?? -1));
    return [...selectedFirst, ...remaining].filter((team) => team.name.toLowerCase().includes(teamQuery.toLowerCase()));
  }, [draft.leagues, teamQuery, teams]);

  const toggle = (field: "leagues" | "teams", id: number) => setDraft((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((item) => item !== id) : [...current[field], id] }));
  const togglePreference = (key: TipPreference) => setDraft((current) => ({ ...current, preferences: current.preferences.includes(key) ? current.preferences.filter((item) => item !== key) : [...current.preferences, key] }));
  const skip = async () => {
    setSaving(true); setError("");
    try { const user = await saveOnboardingPreferences({ action: "skip" }); setUser(user); sessionStorage.removeItem(DRAFT_KEY); router.replace(consumeReturnTo() || "/home"); }
    catch { setError("We could not save that yet. Please try again."); } finally { setSaving(false); }
  };
  const complete = async () => {
    setSaving(true); setError("");
    try { const user = await saveOnboardingPreferences({ action: "complete", favorite_leagues: draft.leagues, favorite_teams: draft.teams, tip_preferences: draft.preferences }); setUser(user); sessionStorage.removeItem(DRAFT_KEY); router.replace(consumeReturnTo() || "/home"); }
    catch { setError("We could not save your preferences. Please try again."); } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-dvh bg-[#08100f] flex items-center justify-center" aria-label="Loading onboarding" />;
  const titles = ["Welcome to Bashiri", "Choose your favourite leagues", "Pick your favourite teams", "What kind of tips do you like?", "You're all set"];
  const subtitles = ["Get smarter football tips, discover top tipsters, and follow the teams and leagues you care about.", "Choose as many as you like. You can change these later.", "Select any teams you want to keep close. This step is optional.", "Pick what you want to notice first. You can change this later.", "Your Bashiri experience is ready to go."];

  return <main className="min-h-dvh bg-[#08100f] px-5 py-8 text-white sm:px-8"><div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col">
    <header className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-amber-300"><Star size={17} /> BASHIRI</span><button type="button" onClick={skip} disabled={saving} className="text-sm text-white/55 hover:text-white">Skip</button></header>
    <div className="mt-8 flex gap-2" aria-label={`Onboarding step ${draft.step + 1} of 5`}>{[0, 1, 2, 3, 4].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= draft.step ? "bg-amber-300" : "bg-white/15"}`} />)}</div>
    <section className="flex flex-1 flex-col justify-center py-10"><div className="mb-8 max-w-xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Step {draft.step + 1} of 5</p><h1 className="text-3xl font-black tracking-tight sm:text-5xl">{titles[draft.step]}</h1><p className="mt-4 max-w-lg text-base leading-7 text-white/60">{subtitles[draft.step]}</p></div>
      {draft.step === 0 && <GlassCard className="p-7 sm:p-10" texture><div className="flex items-start gap-4"><Sparkles className="mt-1 text-amber-300" /><div><h2 className="text-xl font-bold">A sharper way to follow football</h2><p className="mt-2 leading-7 text-white/60">Personalize only what matters, then get straight to the matches and tips.</p></div></div></GlassCard>}
      {draft.step === 1 && <SelectorList query={leagueQuery} onQuery={setLeagueQuery} placeholder="Search leagues" empty="No leagues found" items={visibleLeagues.map((league) => ({ id: league.id, name: league.name, image: league.logo_url, selected: draft.leagues.includes(league.id) }))} onToggle={(id) => toggle("leagues", id)} />}
      {draft.step === 2 && <SelectorList query={teamQuery} onQuery={setTeamQuery} placeholder="Search teams" empty="No teams found" items={visibleTeams.map((team) => ({ id: team.id, name: team.name, image: team.crest_url, selected: draft.teams.includes(team.id), meta: team.league?.name }))} onToggle={(id) => toggle("teams", id)} />}
      {draft.step === 3 && <div className="grid gap-3 sm:grid-cols-2">{tipOptions.map((option) => <button key={option.key} type="button" onClick={() => togglePreference(option.key)} className={`rounded-2xl border p-4 text-left transition ${draft.preferences.includes(option.key) ? "border-amber-300/70 bg-amber-300/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"}`} aria-pressed={draft.preferences.includes(option.key)}><span className="flex items-center justify-between font-bold">{option.title}<span className={`flex h-6 w-6 items-center justify-center rounded-full border ${draft.preferences.includes(option.key) ? "border-amber-300 bg-amber-300 text-black" : "border-white/20"}`}>{draft.preferences.includes(option.key) && <Check size={15} />}</span></span><span className="mt-2 block text-sm leading-6 text-white/50">{option.description}</span></button>)}</div>}
      {draft.step === 4 && <GlassCard className="grid gap-4 p-6 sm:grid-cols-3" texture><Summary label="Favourite leagues" value={draft.leagues.length} /><Summary label="Favourite teams" value={draft.teams.length} /><Summary label="Tip preferences" value={draft.preferences.length} /></GlassCard>}
      {error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}</section>
    <footer className="flex items-center justify-between gap-3 border-t border-white/10 pt-5"><button type="button" onClick={() => setDraft((current) => ({ ...current, step: Math.max(0, current.step - 1) as Step }))} disabled={draft.step === 0 || saving} className="flex items-center gap-2 px-2 py-3 text-sm font-bold text-white/60 disabled:invisible"><ArrowLeft size={18} /> Back</button>{draft.step < 4 ? <PremiumButton type="button" onClick={() => setDraft((current) => ({ ...current, step: (current.step + 1) as Step }))} disabled={saving} size="lg">Continue <ChevronRight size={18} /></PremiumButton> : <PremiumButton type="button" onClick={complete} loading={saving} size="lg">Start Exploring <ChevronRight size={18} /></PremiumButton>}</footer>
  </div></main>;
}

function SelectorList({ query, onQuery, placeholder, empty, items, onToggle }: { query: string; onQuery: (value: string) => void; placeholder: string; empty: string; items: Array<{ id: number; name: string; image?: string; selected: boolean; meta?: string }>; onToggle: (id: number) => void }) {
  return <div><label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><Search size={18} className="text-white/45" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35" /></label><div className="mt-4 grid max-h-[48dvh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{items.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} aria-pressed={item.selected} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${item.selected ? "border-emerald-300/70 bg-emerald-300/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">{item.image ? <img src={item.image} alt="" className="h-full w-full object-contain" /> : <ShieldCheck size={18} className="text-white/40" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name}</span>{item.meta && <span className="block truncate text-xs text-white/40">{item.meta}</span>}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${item.selected ? "border-emerald-300 bg-emerald-300 text-black" : "border-white/20"}`}>{item.selected && <Check size={15} />}</span></button>)}{items.length === 0 && <p className="col-span-full py-8 text-center text-sm text-white/45">{empty}</p>}</div></div>;
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white/[0.04] p-5"><p className="text-sm text-white/50">{label}</p><p className="mt-2 text-3xl font-black text-amber-300">{value}</p></div>; }
