"use client";
import { X, ArrowRight, CheckCircle, TrendingUp, Target, BookOpen, Bookmark, Sparkles, Lock, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface PredictionTutorialProps {
  onClose: () => void;
}

export function PredictionTutorial({ onClose }: PredictionTutorialProps) {
  const [isOpening, setIsOpening] = useState(true);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md"
          style={{ perspective: "2000px" }}
        >
          {/* Book Container */}
          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: isOpening ? 0 : -90 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => setIsOpening(false)}
            className="bg-[#111111] rounded-3xl max-h-[90vh] overflow-y-auto border border-white/10"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "left center",
            }}
          >
            {/* Book Spine Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] rounded-l-3xl" />
            
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-white/10 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -180 }}
                  animate={{ rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                >
                  <BookOpen size={24} className="text-[var(--brand-primary)]" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-xl font-semibold text-white"
                >
                  Jinsi ya Kutumia Bashiri
                </motion.h2>
              </div>
              <motion.button 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-white/10"
              >
                <X size={20} className="text-white/60" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="bg-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">1</div>
                  <h3 className="text-base font-semibold text-white">Angalia AI Predictions</h3>
                  <Sparkles size={20} className="text-[var(--brand-primary)]" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  AI inatoa predictions kwa kila mechi kwa kutumia data ya kihistoria, form ya timu, na takwimu za H2H.
                </p>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Uhakika wa 70%+ = High confidence</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Angalia Top Pick kwa prediction bora</span>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">2</div>
                  <h3 className="text-base font-semibold text-white">Elewa Markets</h3>
                  <TrendingUp size={20} className="text-[var(--brand-primary)]" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  Tunatoa markets mbalimbali kulingana na aina ya bet unayopenda. Chagua market unayoielewa.
                </p>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>1X2 = Matokeo ya mechi (Home/Draw/Away)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Over/Under = Jumla ya magoli</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>BTTS = Timu zote kufunga</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Double Chance = Chansi mbili</span>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">3</div>
                  <h3 className="text-base font-semibold text-white">Hifadhi Markets</h3>
                  <Bookmark size={20} className="text-[var(--brand-primary)]" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  Unaweza kuhifadhi markets unazopenda kwa ajili ya tracking rahisi baadaye.
                </p>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Gonga icon ya bookmark kuhifadhi</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Use "Select Markets" kwa uhifadhi wa wingi</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Angalia "Saved Markets" kwa markets yako</span>
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="bg-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">4</div>
                  <h3 className="text-base font-semibold text-white">Premium Features</h3>
                  <Lock size={20} className="text-[var(--brand-primary)]" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  Kwa watumiaji wa PRO, unapata access zaidi na features za kipekee.
                </p>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Access kwa predictions zote</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Top picks na high confidence markets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>AI Performance Stats kwenye profile</span>
                </div>
              </motion.div>

              {/* Step 5 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="bg-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-black font-semibold text-base">5</div>
                  <h3 className="text-base font-semibold text-white">Track Record</h3>
                  <Trophy size={20} className="text-[var(--brand-primary)]" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  Angalia track record ya predictions za AI kujua accuracy yake.
                </p>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Weekly trend graph kwenye profile</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>AI Performance Stats za kila siku</span>
                </div>
              </motion.div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="bg-[var(--brand-primary)]/5 rounded-2xl p-5 border border-[var(--brand-primary)]/20"
              >
                <h3 className="text-base font-semibold text-[var(--brand-primary)] mb-3">Tips za Kuweka Bets</h3>
                <ul className="text-sm text-white/70 space-y-2 leading-relaxed">
                  <li>• Usitume bets kulingana na predictions pekee</li>
                  <li>• Angalia form ya timu na majeruhi kabla</li>
                  <li>• Tumia predictions kama reference, sio uhakikishi</li>
                  <li>• Daima bet kwa akili yako mwenyewe na risk unaweza</li>
                  <li>• Fuatilia track record ya AI kujifunza patterns</li>
                  <li>• Hifadhi markets unazopenda kwa tracking rahisi</li>
                  <li>• Angalia Top Pick kwa prediction yenye confidence ya juu</li>
                </ul>
              </motion.div>

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="bg-red-500/5 rounded-2xl p-5 border border-red-500/20"
              >
                <h3 className="text-base font-semibold text-red-400 mb-3">Muhimu Kujua</h3>
                <ul className="text-sm text-white/70 space-y-2 leading-relaxed">
                  <li>• Predictions ni kwa burudani tu, sio ushauri wa kamari</li>
                  <li>• Hakuna uhakikishi wa 100% katika betting</li>
                  <li>• Bet kwa akili yako mwenyewe na kwa wajibu</li>
                  <li>• Usibet pesa ambazo hauwezi kuipoteza</li>
                </ul>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#111111] border-t border-white/10 p-5">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, duration: 0.4 }}
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black font-semibold text-base"
              >
                Nimeelewa, Nitaanza
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
