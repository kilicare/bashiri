"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { getPulseSummary, PulseSummary } from "@/lib/api/pulse";
import { getSavedMatches } from "@/lib/api/predictions";
import { LivePulseBar } from "@/components/pulse/LivePulseBar";
import { BentoGrid } from "@/components/pulse/BentoGrid";
import { useCommandPaletteStore } from "@/stores/commandPalette.store";
import { useAuthStore } from "@/stores/auth.store";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function BashiriPulsePage() {
  const router = useRouter();
  const openPalette = useCommandPaletteStore((s) => s.open);
  const access = useAuthStore((s) => s.access);
  const [data, setData] = useState<PulseSummary | null>(null);
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    getPulseSummary().then(setData);
    if (access) getSavedMatches().then(setSaved).catch(() => {});
  }, [access]);

  return (
    <div className="min-h-dvh bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
          <motion.button 
            onClick={() => router.back()} 
            className="p-3 -ml-3 md:-ml-0 rounded-full"
            aria-label="Back"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </motion.button>
          <h1 className="text-lg font-semibold leading-snug" style={{ color: "#D4AF37" }}>⚡ Bashiri Pulse</h1>
          <motion.button 
            onClick={openPalette} 
            className="p-3 -mr-3 md:-mr-0 rounded-full"
            aria-label="Search"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </motion.button>
        </header>

        {!data ? (
          <div className="px-4 md:px-6 lg:px-8 pt-4"><CardSkeleton /></div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="pb-safe"
          >
            {/* LIVE INTELLIGENCE BAR */}
            {data && <LivePulseBar stats={data.stats} />}

            {/* HERO SECTION - MIC */}
            <section className="px-4 md:px-6 lg:px-8 pt-6">
              <BentoGrid data={data} mode="hero" />
            </section>

            {/* LIVE INTELLIGENCE - ROOMS */}
            <section className="px-4 md:px-6 lg:px-8 pt-6">
              <BentoGrid data={data} mode="live-intelligence" />
            </section>

            {/* COMMUNITY - DEBATES */}
            <section className="px-4 md:px-6 lg:px-8 pt-6">
              <BentoGrid data={data} mode="community" />
            </section>

            {/* AI INSIGHTS - DERBY & TRACK RECORD */}
            <section className="px-4 md:px-6 lg:px-8 pt-6">
              <BentoGrid data={data} mode="ai-insights" />
            </section>

            {/* HISTORY - SAVED MATCHES */}
            {saved.length > 0 && (
              <section className="px-4 md:px-6 lg:px-8 pt-8">
                <p className="text-xs font-semibold uppercase mb-4 px-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Endelea na Ulikoishia
                </p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {saved.slice(0, 5).map((s: any) => (
                    <motion.button
                      key={s.id}
                      onClick={() => router.push(`/create/${s.match.id}/overview`)}
                      className="shrink-0 rounded-2xl px-6 py-4 text-left"
                      style={{ background: "#1A1A1A", border: "1px solid rgba(75,85,99,0.3)", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="text-xs font-semibold text-white whitespace-nowrap leading-snug">
                        {s.match.home_team.name} vs {s.match.away_team.name}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* BOTTOM CTA */}
            <div className="px-4 md:px-6 lg:px-8 pt-8 pb-safe text-center">
              <motion.button 
                onClick={() => router.push("/matches")} 
                className="text-xs font-medium px-6 py-4 leading-relaxed rounded-full"
                style={{ color: "rgba(212,175,55,0.8)" }}
                whileHover={{ scale: 1.05, color: "rgba(212,175,55,1)" }}
                whileTap={{ scale: 0.95 }}
              >
                Ona Mechi Zote →
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
