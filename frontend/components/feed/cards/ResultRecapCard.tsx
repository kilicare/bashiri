"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ResultRecapCard({ matchId, data }: { matchId: number | null; data: any }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const { match, ai_predicted, ai_confidence, was_correct } = data;

  const resultColor = was_correct ? "#4CAF50" : "#F44336";
  const resultText = was_correct ? "CORRECT" : "INCORRECT";

  return (
    <div
      className="w-full rounded-2xl border transition-all duration-300"
      style={{ 
        background: "rgba(17, 17, 17, 0.8)", 
        borderColor: "rgba(255, 255, 255, 0.06)"
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          RESULT RECAP
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: was_correct ? "rgba(76, 175, 80, 0.15)" : "rgba(244, 67, 54, 0.15)" }}>
          {was_correct ? <Check size={10} style={{ color: resultColor }} /> : <X size={10} style={{ color: resultColor }} />}
          <span className="text-[9px] font-bold" style={{ color: resultColor }}>
            {resultText}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Match Summary */}
        <div className="text-center mb-3">
          <p className="text-base font-bold text-white mb-1">
            {match.home_team} <span style={{ color: resultColor }}>{match.home_score} - {match.away_score}</span> {match.away_team}
          </p>
          <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
            AI alisema: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{ai_predicted}</span> • {ai_confidence}%
          </p>
        </div>

        {/* Result Summary */}
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: was_correct ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)" }}>
          {was_correct ? <Check size={14} style={{ color: resultColor }} /> : <X size={14} style={{ color: resultColor }} />}
          <span className="text-xs font-medium" style={{ color: resultColor }}>
            {was_correct ? "AI Ilikuwa Sahihi" : "AI Haikufanikiwa"}
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center px-3 py-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <p className="text-lg font-bold" style={{ color: "var(--brand-accent)" }}>{ai_confidence}%</p>
            <p className="text-[10px]" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Uhakika wa AI</p>
          </div>
          <div className="text-center px-3 py-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <p className="text-lg font-bold" style={{ color: was_correct ? "#4CAF50" : "#F44336" }}>{was_correct ? "100%" : "0%"}</p>
            <p className="text-[10px]" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Performance</p>
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ 
            background: "rgba(255, 255, 255, 0.05)",
            color: "rgba(255, 255, 255, 0.7)"
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} />
              Ficha Analysis
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Bonyeza kutazama
            </>
          )}
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
            >
              <div className="space-y-3">
                {/* Prediction */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                    Prediction
                  </p>
                  <p className="text-xs text-white/70">• AI ilitabiri {ai_predicted}</p>
                </div>

                {/* Actual Result */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                    Matokeo Halisi
                  </p>
                  <p className="text-xs text-white/70">• {match.home_team} {match.home_score} - {match.away_score} {match.away_team}</p>
                </div>

                {/* What Worked */}
                {was_correct && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                      Viliyofanya Kazi
                    </p>
                    <p className="text-xs text-green-400/80">✓ Data ya historia ilikuwa sahihi</p>
                    <p className="text-xs text-green-400/80">✓ Form ya timu ililingana na prediction</p>
                  </div>
                )}

                {/* What Didn't Work */}
                {!was_correct && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                      Viliyoshindikana
                    </p>
                    <p className="text-xs text-red-400/80">✗ Mechi ilikuwa na surprises</p>
                    <p className="text-xs text-red-400/80">✗ Factors fulani hazikutarajiwa</p>
                  </div>
                )}

                {/* AI Lesson */}
                <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(212, 175, 55, 0.05)", borderLeft: "2px solid var(--brand-accent)" }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--brand-accent)" }}>
                    AI Lesson
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {was_correct 
                      ? "Prediction ilikuwa sahihi kulingana na data ya historia na form ya timu."
                      : "Michezo inaweza kuwa ngumu kutabiri hata na data nyingi. Hii ni sehemu ya mchezo."
                    }
                  </p>
                </div>

                {/* View Full Analysis Button */}
                {matchId && (
                  <button
                    onClick={() => router.push(`/match/${matchId}/track-record`)}
                    className="w-full py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ 
                      background: "var(--brand-accent)",
                      color: "#000"
                    }}
                  >
                    View Full Analysis
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}