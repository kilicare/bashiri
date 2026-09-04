"use client";

import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { TipStar } from "@/lib/types/tips";

export function TipStarCard({ tipster }: { tipster: TipStar }) {
  return <Link href={`/profile/${tipster.user.username}`} aria-label={`View ${tipster.user.username} profile`}>
    <GlassCard hover className="h-full p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-amber-300/20 text-xl font-black text-amber-200">
          {tipster.user.avatar_url ? <img src={tipster.user.avatar_url} alt="" className="h-full w-full object-cover" /> : tipster.user.username?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0"><p className="truncate font-bold text-white">@{tipster.user.username}</p><p className="mt-1 flex items-center gap-1 text-xs text-white/50">{tipster.user.verified_tipster && <><ShieldCheck size={13} className="text-emerald-300" /> Verified</>}</p></div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
        <Metric label="Accuracy" value={`${tipster.accuracy_percentage}%`} />
        <Metric label="Tips" value={tipster.total_tips.toString()} />
        <Metric label="Score" value={tipster.tipster_score.toString()} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-white/45"><span className="flex items-center gap-1"><Star size={13} className="text-amber-300" /> Tip Star</span><span>{tipster.followers_count} followers</span></div>
    </GlassCard>
  </Link>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] text-white/45">{label}</p><p className="mt-1 font-black text-white">{value}</p></div>; }