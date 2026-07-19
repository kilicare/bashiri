"use client";
import { X, ArrowRight, CheckCircle, TrendingUp, Target, BookOpen } from "lucide-react";

interface PredictionTutorialProps {
  onClose: () => void;
}

export function PredictionTutorial({ onClose }: PredictionTutorialProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-[#111111] border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-semibold text-white">Jinsi ya Kusoma Predictions</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Step 1 */}
          <div className="bg-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">1</div>
            <h3 className="text-base font-semibold text-white">Angalia Uhakika</h3>
            <Target size={20} className="text-[var(--brand-primary)]" />
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">
              Uhakika ni uwezekano wa prediction kuwa sahihi. Viwango vya juu (70%+) vinaonyesha data nyingi inayounga mkono prediction.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>70%+ = High confidence</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">2</div>
              <h3 className="text-base font-semibold text-white">Soma Reasons</h3>
              <TrendingUp size={20} className="text-[var(--brand-primary)]" />
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">
              Kila prediction ina reasons za kuhusu nini AI ilichagua hiyo prediction. Reasons zinaonyesha data ya kihistoria na takwimu.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>Angalia form ya timu, H2H, na stats</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">3</div>
              <h3 className="text-base font-semibold text-white">Chagua Market</h3>
              <ArrowRight size={20} className="text-[var(--brand-primary)]" />
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">
              Tunatoa markets mbalimbali kama 1X2, Over/Under, BTTS. Chagua market unayoielewa vizuri.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>1X2 = Matokeo ya mechi</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>Over/Under = Jumla ya magoli</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>BTTS = Timu zote kufunga</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">4</div>
              <h3 className="text-base font-semibold text-white">Weka Prediction Yako</h3>
              <CheckCircle size={20} className="text-[var(--brand-primary)]" />
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">
              Baada ya kusoma AI prediction, unaweza kuweka prediction yako kwa ajili ya tracking ya accuracy yako mwenyewe.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>Tracking ya accuracy yako</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <CheckCircle size={14} className="text-green-400" />
              <span>Streak na milestones</span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[var(--brand-primary)]/5 rounded-2xl p-5 border border-[var(--brand-primary)]/20">
            <h3 className="text-base font-semibold text-[var(--brand-primary)] mb-3">Tips za Kuweka Predictions</h3>
            <ul className="text-sm text-white/70 space-y-2 leading-relaxed">
              <li>• Usitume bets kulingana na predictions pekee</li>
              <li>• Angalia form ya timu na majeruhi</li>
              <li>• Tumia predictions kama reference, sio uhakikishi</li>
              <li>• Daima bet kwa akili yako mwenyewe</li>
              <li>• Fuatilia accuracy yako kujifunza</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#111111] border-t border-white/10 p-5">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black font-semibold text-base"
          >
            Nimeelewa, Nitaanza
          </button>
        </div>
      </div>
    </div>
  );
}
