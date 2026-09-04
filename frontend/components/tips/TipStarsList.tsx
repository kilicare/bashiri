"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Star } from "lucide-react";
import { getTipStars } from "@/lib/api/tips";
import { TipStar } from "@/lib/types/tips";
import { TipStarCard } from "@/components/tips/TipStarCard";

export function TipStarsList() {
  const [tipsters, setTipsters] = useState<TipStar[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ limit: "20" });
    if (verifiedOnly) params.set("verified", "true");
    getTipStars(params)
      .then((data) => { if (active) setTipsters(data.results); })
      .catch(() => { if (active) setError("Tip Stars could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadToken, verifiedOnly]);

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadToken((current) => current + 1);
  };
  if (loading) return <div className="grid gap-4 sm:grid-cols-2"><div className="h-44 animate-pulse rounded-3xl bg-white/10" /><div className="h-44 animate-pulse rounded-3xl bg-white/10" /></div>;
  if (error) return <div className="rounded-2xl border border-red-300/20 bg-red-300/10 p-6 text-center"><p className="text-sm text-red-200">{error}</p><button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white"><RefreshCw size={15} /> Try again</button></div>;
  return <div><div className="mb-5 flex items-center justify-between gap-3"><div className="flex gap-2"><button type="button" onClick={() => { setLoading(true); setVerifiedOnly(false); }} className={`rounded-xl px-3 py-2 text-sm font-bold ${!verifiedOnly ? "bg-amber-300 text-black" : "bg-white/10 text-white/65"}`}>Top</button><button type="button" onClick={() => { setLoading(true); setVerifiedOnly(true); }} className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold ${verifiedOnly ? "bg-amber-300 text-black" : "bg-white/10 text-white/65"}`}><ShieldCheck size={15} /> Verified</button></div><span className="flex items-center gap-1 text-xs text-white/45"><Star size={13} className="text-amber-300" /> Min. 10 settled tips</span></div>{tipsters.length === 0 ? <div className="rounded-2xl border border-white/10 p-10 text-center"><Star size={32} className="mx-auto mb-3 text-white/20" /><p className="text-sm text-white/50">No Tip Stars match this filter yet.</p></div> : <div className="grid gap-4 sm:grid-cols-2">{tipsters.map((tipster) => <TipStarCard key={tipster.id} tipster={tipster} />)}</div>}</div>;
}