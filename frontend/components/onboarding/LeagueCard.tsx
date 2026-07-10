"use client";

import { clsx } from "clsx";

interface LeagueCardProps {
  id: string;
  name: string;
  logo: string;
  color: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

const leagueNames: Record<string, string> = {
  "PL": "Premier League",
  "PD": "La Liga",
  "BL1": "Bundesliga",
  "FL1": "Ligue 1",
  "SA": "Serie A",
};

export function LeagueCard({ id, name, logo, color, selected, onSelect }: LeagueCardProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={clsx(
        "relative p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 overflow-hidden h-28 md:h-36 w-full",
        selected
          ? "border-[#F5A623] bg-gradient-to-br from-[#F5A623]/20 to-[#E8892A]/10 shadow-[0_0_30px_rgba(245,166,35,0.4)] scale-[1.02]"
          : "border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:scale-[1.01]"
      )}
    >
      {/* Background gradient overlay */}
      <div
        className={clsx(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          selected && "opacity-100"
        )}
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}30 0%, transparent 70%)`,
        }}
      />

      {/* Selection glow effect */}
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/15 to-transparent" />
      )}

      {/* Animated checkmark */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-[#F5A623] to-[#E8892A] rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-3 h-3 md:w-4 md:h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 md:gap-2 h-full">
        {/* League logo */}
        <div
          className={clsx(
            "w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300",
            selected ? "shadow-[0_0_20px_rgba(245,166,35,0.4)]" : "shadow-md"
          )}
          style={{
            background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
            border: `1px solid ${color}50`,
          }}
        >
          <span className="text-xl md:text-2xl font-black text-white">{name[0]}</span>
        </div>

        {/* League name */}
        <div className="text-center">
          <span
            className={clsx(
              "font-black text-xs md:text-sm transition-colors duration-300",
              selected ? "text-[#F5A623]" : "text-white"
            )}
          >
            {name}
          </span>
          {selected && (
            <div className="text-[10px] md:text-xs text-[#F5A623]/80 font-medium mt-0.5">Favorite</div>
          )}
        </div>
      </div>
    </button>
  );
}
