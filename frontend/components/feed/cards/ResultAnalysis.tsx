"use client";
import { CheckCircle, XCircle, TrendingUp, AlertCircle, Info } from "lucide-react";

interface ResultAnalysisProps {
  data: {
    match: {
      home_team: string;
      away_team: string;
      home_score: number;
      away_score: number;
    };
    ai_predicted: string;
    ai_confidence: number;
    was_correct: boolean;
    analysis?: {
      key_factors: string[];
      what_went_right?: string[];
      what_went_wrong?: string[];
      lesson: string;
    };
  };
}

export function ResultAnalysis({ data }: ResultAnalysisProps) {
  const { match, ai_predicted, ai_confidence, was_correct, analysis } = data;

  const defaultAnalysis = {
    key_factors: [
      `AI ilipredicte ${ai_predicted} kwa uhakika wa ${ai_confidence}%`,
      `Matokeo halisi: ${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team}`,
    ],
    what_went_right: was_correct ? [
      "Data ya kihistoria ilikuwa sahihi",
      "Form ya timu ilikamiliana na matokeo"
    ] : undefined,
    what_went_wrong: !was_correct ? [
      "Michezo inaweza kuwa na surprises",
      "Factors zisizotabiri zilikuwepo"
    ] : undefined,
    lesson: was_correct 
      ? "Prediction ilikuwa sahihi kulingana na data ya kihistoria na form ya timu."
      : "Michezo inaweza kuwa ngumu kutabiri hata na data nyingi. Hii ni sehemu ya mchezo."
  };

  const displayAnalysis = analysis || defaultAnalysis;

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        {was_correct ? (
          <CheckCircle size={18} className="text-green-400" />
        ) : (
          <XCircle size={18} className="text-red-400" />
        )}
        <h3 className="text-sm font-bold text-white">
          {was_correct ? "AI Ilikuwa Sahihi ✅" : "AI Haikufanikiwa ❌"}
        </h3>
      </div>

      {/* Key Factors */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Info size={12} className="text-[var(--brand-primary)]" />
          <span className="font-semibold">Vilivyoathiri Prediction:</span>
        </div>
        {displayAnalysis.key_factors.map((factor, index) => (
          <div key={index} className="text-xs text-white/70 pl-4">
            • {factor}
          </div>
        ))}
      </div>

      {/* What went right/wrong */}
      {was_correct && displayAnalysis.what_went_right && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <TrendingUp size={12} className="text-green-400" />
            <span className="font-semibold">Vilivyofanya Kazi:</span>
          </div>
          {displayAnalysis.what_went_right.map((item: string, index: number) => (
            <div key={index} className="text-xs text-green-400/80 pl-4">
              ✓ {item}
            </div>
          ))}
        </div>
      )}

      {!was_correct && displayAnalysis.what_went_wrong && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <AlertCircle size={12} className="text-red-400" />
            <span className="font-semibold">Vilivyoshindikana:</span>
          </div>
          {displayAnalysis.what_went_wrong.map((item: string, index: number) => (
            <div key={index} className="text-xs text-red-400/80 pl-4">
              ✗ {item}
            </div>
          ))}
        </div>
      )}

      {/* Lesson */}
      <div className="bg-[var(--brand-primary)]/5 rounded-xl p-3 border border-[var(--brand-primary)]/20">
        <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
          <Info size={12} className="text-[var(--brand-primary)]" />
          <span className="font-semibold">Somo:</span>
        </div>
        <p className="text-xs text-white/80 leading-relaxed">
          {displayAnalysis.lesson}
        </p>
      </div>

      {/* Confidence Context */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Uhakika wa AI:</span>
          <span className={`font-bold ${ai_confidence >= 70 ? 'text-[var(--brand-accent)]' : ai_confidence >= 55 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>
            {ai_confidence}%
          </span>
        </div>
        <p className="text-xs text-white/50 mt-1">
          {ai_confidence >= 70 
            ? "Uhakika mkubwa - lakini bado si 100%" 
            : "Uhakika wa kati - mechi ilikuwa ngumu kutabiri"}
        </p>
      </div>
    </div>
  );
}
