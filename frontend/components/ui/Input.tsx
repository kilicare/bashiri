"use client";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { clsx } from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  showCalendarIcon?: boolean;
}

export const BashiriInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, showPasswordToggle, showCalendarIcon, type, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPasswordToggle && type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && (
          <label className="text-xs mb-1.5 block font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={clsx(
              "w-full rounded-2xl px-4 py-3.5 text-white text-base bg-[var(--glass-bg)] border border-[var(--color-gold)] outline-none",
              error ? "border-[var(--danger)]" : "border-[var(--color-gold)] focus:border-[var(--color-gold)]",
              (showPasswordToggle || showCalendarIcon) && "pr-12",
              className
            )}
            style={{ backdropFilter: "blur(20px)", boxShadow: "0 0 20px rgba(245,166,35,0.12)" }}
            {...rest}
          />
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 5 10 5a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.41 0 .82-.05 1.22-.12"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          )}
          {showCalendarIcon && type === "date" && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
            </div>
          )}
        </div>
        {error && <p className="text-xs mt-1 text-bashiri-red">{error}</p>}
      </div>
    );
  }
);
BashiriInput.displayName = "BashiriInput";