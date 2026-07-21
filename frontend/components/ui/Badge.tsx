import { clsx } from "clsx";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  // AI Confidence uses brand-accent, not success colors
  // Confidence represents AI certainty, not a successful outcome
  const color = confidence >= 70 ? "var(--brand-accent)" : confidence >= 50 ? "var(--warning)" : "var(--danger)";
  const bgColor = confidence >= 70 ? "rgba(207, 175, 123, 0.15)" : confidence >= 50 ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)";
  const borderColor = confidence >= 70 ? "rgba(207, 175, 123, 0.3)" : confidence >= 50 ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)";
  
  return (
    <span
      className="text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
      style={{ background: bgColor, color, border: `1px solid ${borderColor}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
      {confidence}%
    </span>
  );
}

export function PremiumBadge({ children, variant = "gold" }: { children: React.ReactNode; variant?: "gold" | "sand" | "green" | "red" }) {
  const variants = {
    gold: "bg-gradient-to-r from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/20 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]",
    sand: "bg-gradient-to-r from-[var(--brand-accent)]/20 to-[var(--brand-accent)]/10 border-[var(--brand-accent)]/30 text-[var(--brand-accent)]",
    green: "bg-gradient-to-r from-[var(--success)]/20 to-[var(--success)]/20 border-[var(--success)]/30 text-[var(--success)]",
    red: "bg-gradient-to-r from-[var(--danger)]/20 to-[var(--danger)]/20 border-[var(--danger)]/30 text-[var(--danger)]",
  };
  
  return (
    <span className={clsx("text-xs font-medium px-3 py-1 rounded-full border transition-all duration-300 hover:scale-105", variants[variant])}>
      {children}
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--danger)" }}>
      <span className="w-2 h-2 rounded-full" style={{ background: "var(--danger)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
      LIVE
    </span>
  );
}