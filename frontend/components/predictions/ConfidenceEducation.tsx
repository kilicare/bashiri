"use client";
import { X, Info, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface ConfidenceEducationProps {
  onClose: () => void;
}

export function ConfidenceEducation({ onClose }: ConfidenceEducationProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-[#111111] border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info size={24} className="text-[var(--brand-primary)]" />
            <h2 className="text-xl font-semibold text-white">Uhakika wa AI</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* What is Confidence */}
          <div className="bg-white/5 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-white mb-3">Uhakika ni Nini?</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Uhakika ni uwezekano wa AI kufanya prediction sahihi, kulingana na data ya kihistoria na takwimu za timu. Si kuhakikishi 100%.
            </p>
          </div>

          {/* Confidence Levels */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Viwango vya Uhakika</h3>
            
            <div className="flex items-start gap-3 bg-[var(--brand-accent)]/10 rounded-xl p-4 border border-[var(--brand-accent)]/20">
              <span className="text-2xl mt-0.5">🔥</span>
              <div>
                <p className="text-base font-semibold text-[var(--brand-accent)]">80%+ Uhakika Mkubwa Sana</p>
                <p className="text-sm text-white/60">Bora zaidi, lakini si guarantee</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[var(--success)]/10 rounded-xl p-4 border border-[var(--success)]/20">
              <span className="text-2xl mt-0.5">✅</span>
              <div>
                <p className="text-base font-semibold text-[var(--success)]">65-80% AI Ina Uhakika Mzuri</p>
                <p className="text-sm text-white/60">Nzuri - Chaguo salama</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[var(--warning)]/10 rounded-xl p-4 border border-[var(--warning)]/20">
              <span className="text-2xl mt-0.5">⚠️</span>
              <div>
                <p className="text-base font-semibold text-[var(--warning)]">50-65% Wastani — Angalia kwa Makini</p>
                <p className="text-sm text-white/60">Uhakika wa kati - Tazama kwa makini</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[var(--danger)]/10 rounded-xl p-4 border border-[var(--danger)]/20">
              <span className="text-2xl mt-0.5">🔴</span>
              <div>
                <p className="text-base font-semibold text-[var(--danger)]">0-50% Chini — Hatari Kubwa</p>
                <p className="text-sm text-white/60">Uhakika mdogo - Epuka kama inawezekana</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-[var(--brand-primary)]/5 rounded-2xl p-5 border border-[var(--brand-primary)]/20">
            <h3 className="text-base font-semibold text-[var(--brand-primary)] mb-3">Kumbuka</h3>
            <ul className="text-sm text-white/70 space-y-2 leading-relaxed">
              <li>• Hakuna prediction ya 100% katika michezo</li>
              <li>• Hata prediction yenye uhakika 70% inaweza kushindwa</li>
              <li>• Tumia predictions kama msaada, sio uhakikishi</li>
              <li>• Daima bet kwa akili yako mwenyewe</li>
            </ul>
          </div>

          {/* AI Performance */}
          <div className="bg-white/5 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-white mb-3">Performance ya AI</h3>
            <p className="text-sm text-white/70 leading-relaxed mb-3">
              Tunafuatilia accuracy ya AI kila siku. Unaweza kuona history ya performance kwenye profile yako.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/50">Accuracy ya wiki:</span>
              <span className="font-semibold text-[var(--success)]">72.5%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#111111] border-t border-white/10 p-5">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black font-semibold text-base"
          >
            Nimeelewa
          </button>
        </div>
      </div>
    </div>
  );
}
