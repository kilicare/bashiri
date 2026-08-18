"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MessageSquare, Flame, Trophy, Radio } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { PulseSummary } from "@/lib/api/pulse";
import { shouldReduceMotion, getAnimationDuration, getAnimationEasing } from "@/utils/animation";
import { useMobileTooltip } from "@/hooks/useMobileTooltip";

const MOOD_EMOJI: Record<string, string> = {
  FUNNY: "😂", FIRE: "🔥", ANGRY: "😡", RESPECT: "👏", SHOCK: "🤯", PAIN: "💔",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

type BentoGridMode = 'hero' | 'live-intelligence' | 'community' | 'ai-insights';

export function BentoGrid({ data, mode }: { data: PulseSummary; mode?: BentoGridMode }) {
  const router = useRouter();
  const featuredMic = data.mic.featured_reactions[0];
  const featuredRoom = data.rooms.live_matches[0];
  const hasDerby = !!data.derby;

  // If no mode specified, render all cards (legacy behavior)
  if (!mode) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        <HeroCard featuredMic={featuredMic} data={data} router={router} />
        <LiveIntelligenceCard featuredRoom={featuredRoom} router={router} />
        <CommunityCard data={data} router={router} />
        {hasDerby && <DerbyCard data={data} router={router} />}
        <AIInsightsCard data={data} hasDerby={hasDerby} router={router} />
      </div>
    );
  }

  // Render specific section based on mode
  return (
    <>
      {mode === 'hero' && <HeroCard featuredMic={featuredMic} data={data} router={router} />}
      {mode === 'live-intelligence' && <LiveIntelligenceCard featuredRoom={featuredRoom} router={router} />}
      {mode === 'community' && <CommunityCard data={data} router={router} />}
      {mode === 'ai-insights' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {hasDerby && <DerbyCard data={data} router={router} />}
          <AIInsightsCard data={data} hasDerby={hasDerby} router={router} />
        </div>
      )}
    </>
  );
}

// LEVEL 1: Hero Card - Dominant visual weight, cinematic proportions
function HeroCard({ featuredMic, data, router }: { featuredMic: any, data: PulseSummary, router: any }) {
  return (
    <motion.button
      variants={cardVariants}
      layout
      onClick={() => router.push("/mic")}
      className="w-full rounded-3xl overflow-hidden relative text-left"
      style={{ 
        height: '240px', 
        minHeight: '220px', 
        background: "#0A0A0F", 
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "0 0 40px rgba(212,175,55,0.08)"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {featuredMic ? (
        <video
          src={featuredMic.video_url}
          muted loop autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.65 }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12), transparent)" }} />
      )}
      <div 
        className="absolute inset-0" 
        style={{ background: "linear-gradient(180deg, transparent 20%, rgba(10,10,15,0.85) 70%, rgba(10,10,15,0.98) 100%)" }} 
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Mic size={20} style={{ color: "#D4AF37" }} />
          <span className="text-xs font-semibold uppercase" style={{ color: "#D4AF37" }}>Bashiri Mic</span>
        </div>
        <p className="text-2xl font-semibold text-white mb-3 leading-snug">
          {featuredMic ? `@${featuredMic.username} ${MOOD_EMOJI[featuredMic.mood] || ""}` : "Ona Video za Mashabiki"}
        </p>
        <p className="text-sm font-normal leading-relaxed" style={{ color: "rgba(248,250,252,0.7)" }}>
          {data.mic.active_matches_count} mechi zinapokea video sasa
        </p>
      </div>
    </motion.button>
  );
}

// LEVEL 2: Featured Cards - Secondary visual weight, important but never equal to Hero
function LiveIntelligenceCard({ featuredRoom, router }: { featuredRoom: any, router: any }) {
  return (
    <motion.button
      variants={cardVariants}
      layout
      onClick={() => featuredRoom ? router.push(`/match/${featuredRoom.id}/room`) : router.push("/matches")}
      className="w-full rounded-3xl p-6 text-left"
      style={{
        background: "#1A1A1A",
        border: featuredRoom ? "1px solid rgba(212,175,55,0.25)" : "1px solid rgba(75,85,99,0.3)",
        minHeight: '140px',
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3 mb-4">
        {featuredRoom && <span className="live-dot" />}
        <Radio size={18} style={{ color: "#D4AF37" }} />
      </div>
      <p className="text-lg font-semibold text-white mb-3 leading-snug">Match Rooms</p>
      {featuredRoom ? (
        <p className="text-sm font-normal leading-relaxed" style={{ color: "rgba(248,250,252,0.7)" }}>
          {featuredRoom.home_team} {featuredRoom.home_score}-{featuredRoom.away_score} {featuredRoom.away_team}
        </p>
      ) : (
        <p className="text-sm font-normal leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>Hakuna live sasa</p>
      )}
    </motion.button>
  );
}

function CommunityCard({ data, router }: { data: PulseSummary, router: any }) {
  return (
    <motion.button
      variants={cardVariants}
      layout
      onClick={() => router.push("/debates")}
      className="w-full rounded-3xl p-6 text-left"
      style={{ background: "#1A1A1A", border: "1px solid rgba(239,68,68,0.25)", minHeight: '140px', boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare size={18} style={{ color: "#EF4444" }} />
      </div>
      <p className="text-lg font-semibold text-white mb-3 leading-snug">Debates</p>
      {data.debates.open[0] ? (
        <p className="text-sm font-normal truncate leading-relaxed" style={{ color: "rgba(248,250,252,0.7)" }}>{data.debates.open[0].question}</p>
      ) : (
        <p className="text-sm font-normal leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>Hakuna debate wazi</p>
      )}
    </motion.button>
  );
}

// LEVEL 3: Standard Cards - Balanced, clean, consistent
function DerbyCard({ data, router }: { data: PulseSummary, router: any }) {
  return (
    <motion.button
      variants={cardVariants}
      layout
      onClick={() => router.push("/derby")}
      className="rounded-3xl p-6 text-left"
      style={{ background: `${data.derby!.theme_accent_color}15`, border: `1px solid ${data.derby!.theme_accent_color}40`, minHeight: '140px', boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Flame size={18} style={{ color: data.derby!.theme_accent_color }} />
      </div>
      <p className="text-lg font-semibold text-white mb-3 leading-snug">{data.derby!.derby_name}</p>
      <p className="text-sm font-normal leading-relaxed" style={{ color: "rgba(248,250,252,0.7)" }}>
        {data.derby!.home_team} vs {data.derby!.away_team}
      </p>
    </motion.button>
  );
}

// LEVEL 4: Compact Cards - Statistics, minimal, whispers
function AIInsightsCard({ data, hasDerby, router }: { data: PulseSummary, hasDerby: boolean, router: any }) {
  const { tooltip, handleChartClick, hideTooltip } = useMobileTooltip();

  return (
    <motion.button
      variants={cardVariants}
      layout
      onClick={() => router.push("/track-record")}
      className={hasDerby ? "rounded-3xl p-6 text-left" : "w-full rounded-3xl p-6 text-left"}
      style={{ background: "#1A1A1A", border: "1px solid rgba(232,212,184,0.25)", minHeight: '140px', boxShadow: "0 0 20px rgba(232,212,184,0.06)" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy size={18} style={{ color: "#E8D4B8" }} />
          <p className="text-base font-semibold text-white leading-snug">Track Record</p>
        </div>
        {data.track_record.latest_accuracy !== null && (
          <span className="text-base font-semibold leading-snug" style={{ color: "#E8D4B8" }}>{data.track_record.latest_accuracy}%</span>
        )}
      </div>
      {data.track_record.weekly_trend.length > 1 && (
        <div
          className="h-14 cursor-pointer relative chart-glass"
          onClick={(e) => {
            e.stopPropagation();
            handleChartClick(e, { accuracy_percentage: data.track_record.weekly_trend[data.track_record.weekly_trend.length - 1]?.accuracy_percentage });
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data.track_record.weekly_trend}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <Line 
                type="monotone" 
                dataKey="accuracy_percentage" 
                stroke="#E8D4B8" 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={!shouldReduceMotion()}
                animationDuration={getAnimationDuration(600)}
                animationEasing={getAnimationEasing('ease-out')}
                animationBegin={0}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Mobile Tooltip */}
          {tooltip.visible && (
            <div
              className="fixed bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm z-50 pointer-events-none border border-white/10"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 40}px`,
                transform: 'translateX(-50%)',
              }}
            >
              {tooltip.content}
            </div>
          )}
        </div>
      )}
    </motion.button>
  );
}
