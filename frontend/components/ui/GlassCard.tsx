import { clsx } from "clsx";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, hover = false, glow = false }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-3xl border border-white/10",
        "bg-gradient-to-br from-white/5 to-white/[0.02]",
        "backdrop-blur-xl",
        hover && "hover:from-white/10 hover:to-white/5 hover:border-white/20 hover:scale-[1.02] transition-all duration-300",
        glow && "shadow-[0_0_40px_rgba(207,175,123,0.15)]",
        className
      )}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "gold" | "sand" | "gradient";
  hover?: boolean;
}

export function PremiumCard({ children, className, variant = "default", hover = false }: PremiumCardProps) {
  const variants = {
    default: "bg-[#1A1A24] border-white/10",
    gold: "bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/5 border-[var(--brand-primary)]/20",
    sand: "bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-accent)]/5 border-[var(--brand-accent)]/20",
    gradient: "bg-gradient-to-br from-[#1A1A24] to-[#22222E] border-white/10",
  };

  return (
    <div
      className={clsx(
        "relative rounded-3xl border p-5",
        variants[variant],
        hover && "hover:scale-[1.02] hover:shadow-xl transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
