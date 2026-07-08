"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const BashiriInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="text-xs mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-2xl px-4 py-3.5 text-white text-base bg-[#2D1B3E] border outline-none",
          error ? "border-bashiri-red" : "border-bashiri-purple/30 focus:border-bashiri-gold",
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs mt-1 text-bashiri-red">{error}</p>}
    </div>
  )
);
BashiriInput.displayName = "BashiriInput";