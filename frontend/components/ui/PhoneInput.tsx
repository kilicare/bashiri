"use client";
import { useState, forwardRef, InputHTMLAttributes } from "react";
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

    // Format phone number for display (with spaces)
    const formatDisplay = (num: string) => {
      const cleaned = num.replace(/\D/g, "");
      if (cleaned.length >= 9) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
      }
      if (cleaned.length >= 6) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
      }
      if (cleaned.length >= 3) {
        return `${cleaned.slice(0, 3)}`;
      }
      return cleaned;
    };

    // Format phone number for backend (+255xxxxxxxxx)
    const formatBackend = (num: string) => {
      let cleaned = num.replace(/\D/g, "");
      
      // Remove leading 0
      if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
      }
      
      // Remove leading 255 if exists
      if (cleaned.startsWith("255")) {
        cleaned = cleaned.slice(3);
      }
      
      // Validate length (should be 9 digits for Tanzania)
      if (cleaned.length === 9) {
        return `+255${cleaned}`;
      }
      
      return `+255${cleaned}`;
    };

    // Validate phone number
    const validatePhone = (num: string) => {
      const cleaned = num.replace(/\D/g, "");
      // Tanzania phone numbers are 9 digits after country code
      return cleaned.length === 9;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleaned = inputValue.replace(/\D/g, "");
      
      // Limit to 9 digits (local number)
      const truncated = cleaned.slice(0, 9);
      
      // Use raw value for input (no spaces) to prevent cursor issues
      setDisplayValue(truncated);
      
      // Update parent with formatted backend value
      const backendValue = formatBackend(truncated);
      onChange(backendValue);
      
      // Validate
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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <span className="text-lg">🇹🇿</span>
            <span className="text-white font-medium">+255</span>
            <span className="text-white/30">|</span>
          </div>
          <input
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            placeholder="650745642"
            className={clsx(
              "w-full rounded-2xl pl-28 pr-12 py-3.5 text-white text-base bg-[#2D1B3E] border outline-none",
              error ? "border-bashiri-red" : "border-bashiri-purple/30 focus:border-bashiri-gold",
              className
            )}
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
        {!error && isValid === false && (
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
