"use client";
import { useState, useEffect, forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, value, onChange, ...rest }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const getLocalPhoneDigits = (num: string) => {
      let cleaned = num.replace(/\D/g, "");
      if (cleaned.startsWith("255")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
      }
      return cleaned.slice(0, 9);
    };

    // Format phone number for backend (+255xxxxxxxxx)
    const formatBackend = (num: string) => {
      const cleaned = getLocalPhoneDigits(num);
      return `+255${cleaned}`;
    };

    // Validate phone number
    const validatePhone = (num: string) => getLocalPhoneDigits(num).length === 9;

    useEffect(() => {
      setDisplayValue(getLocalPhoneDigits(value || ""));
      setIsValid(value ? validatePhone(value) : null);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const truncated = getLocalPhoneDigits(inputValue);
      setDisplayValue(truncated);

      const backendValue = formatBackend(truncated);
      onChange(backendValue);
      setIsValid(validatePhone(truncated));
    };

    return (
      <div className="w-full">
        {label && (
          <label className="text-xs mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
            <span className="text-lg">🇹🇿</span>
            <span className="text-white font-semibold text-base">+255</span>
            <span className="text-white/40 font-light">|</span>
          </div>
          <input
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            placeholder="650745642"
            className={clsx(
              "w-full rounded-2xl pl-32 pr-12 py-3.5 text-white text-base bg-[var(--glass-bg)] border border-[var(--color-gold)] outline-none",
              error ? "border-[var(--danger)]" : "border-[var(--color-gold)] focus:border-[var(--color-gold)]",
              className
            )}
            style={{ backdropFilter: "blur(20px)", boxShadow: "0 0 20px rgba(245,166,35,0.12)" }}
            {...rest}
          />
          {isValid !== null && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValid ? (
                <span className="text-bashiri-gold text-lg">✓</span>
              ) : (
                <span className="text-red-400 text-lg">❌</span>
              )}
            </div>
          )}
        </div>
        {error && <p className="text-xs mt-1 text-bashiri-red">{error}</p>}
        {!error && isValid === false && displayValue && (
          <p className="text-xs mt-1 text-red-400">Namba si sahihi</p>
        )}
        {!error && isValid === true && (
          <p className="text-xs mt-1 text-bashiri-gold">✓ Namba iko sahihi</p>
        )}
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          Andika namba bila kuanza na 0 au +255. Mfano: 650745642
        </p>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
