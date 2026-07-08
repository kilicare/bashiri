"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMatchHubBadges, MatchHubBadges } from "@/lib/api/match-hub";

type TabKey = "overview" | "predict" | "room" | "mic";

interface Props {
  matchId: number;
  active: TabKey;
}

const BASE_TABS: { key: TabKey; label: string; path: string }[] = [
  { key: "overview", label: "Overview", path: "create" },
  { key: "predict", label: "Predict", path: "create" },
  { key: "room", label: "Room", path: "match" },
  { key: "mic", label: "Mic", path: "match" },
];

export function MatchHubTabs({ matchId, active }: Props) {
  const router = useRouter();
  const [badges, setBadges] = useState<MatchHubBadges | null>(null);

  useEffect(() => {
    getMatchHubBadges(matchId).then(setBadges).catch(() => {});
  }, [matchId]);

  function navigateTo(tab: TabKey) {
    if (tab === "overview") router.push(`/create/${matchId}/overview`);
    else if (tab === "predict") router.push(`/create/${matchId}/predict`);
    else if (tab === "room") router.push(`/match/${matchId}/room`);
    else if (tab === "mic") router.push(`/match/${matchId}/mic`);
  }

  function badgeFor(tab: TabKey): string | null {
    if (!badges) return null;
    if (tab === "room") {
      if (badges.room_state === "live") return "🔴 LIVE";
      if (badges.room_state === "watch_party") return null;
      return null;
    }
    if (tab === "mic" && badges.mic_reaction_count > 0) {
      return String(badges.mic_reaction_count);
    }
    return null;
  }

  function labelFor(tab: TabKey): string {
    if (tab === "room") {
      if (badges?.room_state === "watch_party") return "Watch Party";
      if (badges?.room_state === "closed") return "Room (Closed)";
      return "Room";
    }
    return BASE_TABS.find((t) => t.key === tab)?.label || tab;
  }

  return (
    <div className="flex gap-2 px-5 pb-4 overflow-x-auto">
      {BASE_TABS.map((tab) => {
        const isActive = tab.key === active;
        const badge = badgeFor(tab.key);
        return (
          <button
            key={tab.key}
            onClick={() => navigateTo(tab.key)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
            style={{
              background: isActive ? "#00FF87" : "rgba(255,255,255,0.06)",
              color: isActive ? "#000" : "rgba(255,255,255,0.5)",
            }}
          >
            {labelFor(tab.key)}
            {badge && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px]"
                style={{
                  background: isActive ? "rgba(0,0,0,0.2)" : "rgba(255,71,87,0.15)",
                  color: isActive ? "#000" : "#FF4757",
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
