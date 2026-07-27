/**
 * lib/confidence-tiers.ts
 *
 * Chanzo KIMOJA cha ukweli kuhusu "asilimia hii ina maana gani" —
 * kinatumika KILA MAHALI (MarketRow, AnalysisMarketRow, TopPickCard,
 * ConfidenceLegend) ili rangi zibebe MAANA (juu=kijani, chini=nyekundu)
 * badala ya kutegemea NAFASI ya option (bug ya awali).
 */
export interface ConfidenceTier {
  label: string;
  shortLabel: string;
  color: string;
  emoji: string;
  min: number;
  max: number;
}

export const CONFIDENCE_TIERS: ConfidenceTier[] = [
  { label: "Uhakika Mkubwa Sana", shortLabel: "Juu Sana", color: "#00FF87", emoji: "🔥", min: 80, max: 100 },
  { label: "AI Ina Uhakika Mzuri", shortLabel: "Nzuri", color: "#4ADE80", emoji: "✅", min: 65, max: 80 },
  { label: "Wastani — Angalia kwa Makini", shortLabel: "Wastani", color: "#FFD600", emoji: "⚠️", min: 50, max: 65 },
  { label: "Chini — Hatari Kubwa", shortLabel: "Chini", color: "#FF4757", emoji: "🔴", min: 0, max: 50 },
];

export function getConfidenceTier(percentage: number): ConfidenceTier {
  // Tumia >= min kwa mpangilio kutoka juu kwenda chini (80+ inashinda kwanza)
  return (
    CONFIDENCE_TIERS.find((t) => percentage >= t.min && percentage < (t.max === 100 ? 101 : t.max)) ||
    CONFIDENCE_TIERS[CONFIDENCE_TIERS.length - 1]
  );
}

export function getConfidenceColor(percentage: number): string {
  return getConfidenceTier(percentage).color;
}
