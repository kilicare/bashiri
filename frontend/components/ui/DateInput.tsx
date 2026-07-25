"use client";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { clsx } from "clsx";

interface Props {
  label?: string;
  value?: string;
  onChange: (date: string) => void;
  error?: string;
  className?: string;
}

export const BashiriDateInput = ({ label, value, onChange, error, className }: Props) => {
  const [date, setDate] = useState<Date | null>(value ? new Date(value) : null);

  const handleChange = (date: Date | null) => {
    setDate(date);
    if (date) {
      // Format date as YYYY-MM-DD for the input
      const formatted = date.toISOString().split('T')[0];
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-xs mb-1.5 block font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {label}
        </label>
      )}
      <div className="relative">
        <ReactDatePicker
          selected={date}
          onChange={handleChange}
          dateFormat="yyyy-MM-dd"
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={100}
          maxDate={new Date()}
          placeholderText="Chagua tarehe"
          className={clsx(
            "w-full rounded-2xl px-4 py-3.5 text-white text-base bg-[var(--glass-bg)] border border-[var(--color-gold)] outline-none",
            error ? "border-[var(--danger)]" : "border-[var(--color-gold)] focus:border-[var(--color-gold)]",
            "pr-12",
            className
          )}
          calendarClassName="bashiri-calendar"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
        </div>
      </div>
      {error && <p className="text-xs mt-1 text-bashiri-red">{error}</p>}
      
      {/* Custom styles for the calendar */}
      <style jsx global>{`
        .bashiri-calendar {
          background: rgba(30, 30, 30, 0.95) !important;
          border: 1px solid var(--color-gold) !important;
          border-radius: 12px !important;
          backdrop-filter: blur(20px) !important;
        }
        .bashiri-calendar .react-datepicker__header {
          background: rgba(40, 40, 40, 0.9) !important;
          border-bottom: 1px solid var(--color-gold) !important;
          border-radius: 12px 12px 0 0 !important;
        }
        .bashiri-calendar .react-datepicker__current-month {
          color: var(--color-gold) !important;
          font-weight: bold !important;
        }
        .bashiri-calendar .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .bashiri-calendar .react-datepicker__day {
          color: white !important;
        }
        .bashiri-calendar .react-datepicker__day:hover {
          background: var(--color-gold) !important;
          color: black !important;
        }
        .bashiri-calendar .react-datepicker__day--selected {
          background: var(--color-gold) !important;
          color: black !important;
        }
        .bashiri-calendar .react-datepicker__day--keyboard-selected {
          background: rgba(212, 175, 55, 0.3) !important;
          color: white !important;
        }
        .bashiri-calendar .react-datepicker__year-dropdown {
          background: rgba(30, 30, 30, 0.95) !important;
          border: 1px solid var(--color-gold) !important;
          border-radius: 8px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
        }
        .bashiri-calendar .react-datepicker__year-option {
          color: white !important;
          padding: 8px 12px !important;
        }
        .bashiri-calendar .react-datepicker__year-option:hover {
          background: var(--color-gold) !important;
          color: black !important;
        }
        .bashiri-calendar .react-datepicker__year-option--selected {
          background: var(--color-gold) !important;
          color: black !important;
        }
        .bashiri-calendar .react-datepicker__navigation {
          color: var(--color-gold) !important;
        }
        .bashiri-calendar .react-datepicker__navigation:hover {
          background: rgba(212, 175, 55, 0.2) !important;
        }
      `}</style>
    </div>
  );
};
