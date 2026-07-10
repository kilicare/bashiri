"use client";
import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

export function PremiumButton({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  const base = "font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden";
  
  const sizes = {
    sm: "px-4 py-2.5 text-sm rounded-xl",
    md: "px-5 py-3 text-sm rounded-2xl",
    lg: "px-6 py-4 text-base rounded-2xl",
    xl: "px-8 py-5 text-lg rounded-3xl",
  };
  
  const variants = {
    primary: "bg-gradient-to-r from-[#F5A623] to-[#E8892A] text-black shadow-lg shadow-[rgba(245,166,35,0.25)] hover:shadow-xl hover:shadow-[rgba(245,166,35,0.35)] hover:scale-[1.02] active:scale-[0.98]",
    gold: "bg-gradient-to-r from-[#F5A623] to-[#E8892A] text-black shadow-lg shadow-[rgba(245,166,35,0.25)] hover:shadow-xl hover:shadow-[rgba(245,166,35,0.35)] hover:scale-[1.02] active:scale-[0.98]",
    outline: "border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]",
    ghost: "text-white/70 hover:text-white hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:scale-[1.02] active:scale-[0.98]",
  };

  return (
    <button
      className={clsx(
        base,
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        (disabled || loading) && "opacity-50 cursor-not-allowed hover:scale-100",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {loading ? "Inatuma..." : children}
    </button>
  );
}

// Backward compatibility alias
export const BashiriButton = PremiumButton;