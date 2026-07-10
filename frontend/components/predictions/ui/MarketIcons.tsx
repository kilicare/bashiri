export const MARKET_ICONS: Record<string, string> = {
  "1X2": "🏆",
  "DOUBLE_CHANCE": "🎲",
  "BTTS": "🤝",
  "OVER_UNDER_2.5": "⚽",
  "OVER_UNDER_0.5": "🎯",
  "OVER_UNDER_1.5": "🥅",
  "OVER_UNDER_3.5": "🚀",
  "OVER_UNDER_4.5": "💥",
  "DRAW_NO_BET": "⚖️",
  "BOTH_TEAMS_TO_SCORE": "🤝",
  "CORRECT_SCORE": "📊",
  "CORNERS": "🚩",
  "CARDS": "🟨",
  "HALF_TIME_FULL_TIME": "⏰",
  "WIN_TO_NIL": "🛡️",
  "ASIAN_HANDICAP": "📈",
};

export function getMarketIcon(marketKey: string): string {
  const normalizedKey = marketKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  return MARKET_ICONS[normalizedKey] || "📊";
}
