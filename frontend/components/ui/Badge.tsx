import { clsx } from "clsx";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? "#10B981" : confidence >= 50 ? "#FFD54A" : "#EF4444";
  const bgColor = confidence >= 70 ? "rgba(16, 185, 129, 0.15)" : confidence >= 50 ? "rgba(255, 213, 74, 0.15)" : "rgba(239, 68, 68, 0.15)";
  const borderColor = confidence >= 70 ? "rgba(16, 185, 129, 0.3)" : confidence >= 50 ? "rgba(255, 213, 74, 0.3)" : "rgba(239, 68, 68, 0.3)";
  
  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
      style={{ background: bgColor, color, border: `1px solid ${borderColor}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      {confidence}%
    </span>
  );
}

export function PremiumBadge({ children, variant = "gold" }: { children: React.ReactNode; variant?: "gold" | "purple" | "green" | "red" }) {
  const variants = {
    gold: "bg-gradient-to-r from-[#FFD54A]/20 to-[#FFB300]/20 border-[#FFD54A]/30 text-[#FFD54A]",
    purple: "bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    green: "bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    red: "bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
  };
  
  return (
    <span className={clsx("text-xs font-bold px-3 py-1 rounded-full border transition-all duration-300 hover:scale-105", variants[variant])}>
      {children}
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      LIVE
    </span>
  );
}