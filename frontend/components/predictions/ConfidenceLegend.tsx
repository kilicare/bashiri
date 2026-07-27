import { CONFIDENCE_TIERS } from "@/lib/confidence-tiers";

export function ConfidenceLegend() {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
        Jinsi ya Kusoma Asilimia
      </p>
      <div className="space-y-2">
        {CONFIDENCE_TIERS.map((tier) => (
          <div key={tier.label} className="flex items-center gap-3">
            <span className="w-11 text-xs font-bold" style={{ color: tier.color }}>
              {tier.max === 100 ? `${tier.min}%+` : `${tier.min}-${tier.max}%`}
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              {tier.emoji} {tier.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
        Asilimia ya chini haimaanishi "makosa" — inaonyesha tu kiwango cha uhakika wa takwimu.
      </p>
    </div>
  );
}
