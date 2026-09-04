"use client";

import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { TipStarsList } from "@/components/tips/TipStarsList";

export default function TipStarsPage() {
  return <main className="min-h-dvh bg-[#0a0a0a] px-5 py-7 text-white sm:px-8"><div className="mx-auto max-w-4xl"><Link href="/tips" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/55 hover:text-white"><ArrowLeft size={17} /> Back to tips</Link><div className="mb-8"><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-300"><Star size={15} /> Bashiri discovery</p><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Tip Stars</h1><p className="mt-3 max-w-xl text-white/55">Top-performing tipsters on Bashiri, ranked by proven performance and reliability.</p></div><TipStarsList /></div></main>;
}