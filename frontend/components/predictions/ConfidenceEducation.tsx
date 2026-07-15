"use client";
import { X, Info, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface ConfidenceEducationProps {
  onClose: () => void;
}

export function ConfidenceEducation({ onClose }: ConfidenceEducationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-[#111111] border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-[#F5A623]" />
            <h2 className="text-lg font-black text-white">Uhakika wa AI</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* What is Confidence */}
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-2">Uhakika ni Nini?</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Uhakika ni uwezekano wa AI kufanya prediction sahihi, kulingana na data ya kihistoria na takwimu za timu. Si kuhakikishi 100%.
            </p>
          </div>

          {/* Confidence Levels */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Viwango vya Uhakika</h3>
            
            <div className="flex items-start gap-3 bg-green-500/10 rounded-xl p-3 border border-green-500/20">
              <CheckCircle size={18} className="text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-400">70%+ (High)</p>
                <p className="text-xs text-white/60">Uhakika mkubwa - AI ina data nyingi ya kuhakikisha</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#F5A623]/10 rounded-xl p-3 border border-[#F5A623]/20">
              <TrendingUp size={18} className="text-[#F5A623] mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#F5A623]">55-69% (Edge)</p>
                <p className="text-xs text-white/60">Uhakika wa kati - Fa ndogo lakini inaweza kufanya kazi</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
              <AlertTriangle size={18} className="text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400">&lt;55% (Low)</p>
                <p className="text-xs text-white/60">Uhakika mdogo - Mechi ngumu kutabiri</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-[#F5A623]/5 rounded-2xl p-4 border border-[#F5A623]/20">
            <h3 className="text-sm font-bold text-[#F5A623] mb-2">Kumbuka</h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• Hakuna prediction ya 100% katika michezo</li>
              <li>• Hata prediction yenye uhakika 70% inaweza kushindwa</li>
              <li>• Tumia predictions kama msaada, sio uhakikishi</li>
              <li>• Daima bet kwa akili yako mwenyewe</li>
            </ul>
          </div>

          {/* AI Performance */}
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-2">Performance ya AI</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-3">
              Tunafuatilia accuracy ya AI kila siku. Unaweza kuona history ya performance kwenye profile yako.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/50">Accuracy ya wiki:</span>
              <span className="font-bold text-[#00FF87]">72.5%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#111111] border-t border-white/10 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#E8892A] text-black font-bold text-sm"
          >
            Nimeelewa
          </button>
        </div>
      </div>
    </div>
  );
}
