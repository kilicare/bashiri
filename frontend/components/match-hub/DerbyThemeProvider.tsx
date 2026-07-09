"use client";
import { useEffect, useState, ReactNode } from "react";
import { getActiveDerby, ActiveDerby, ActiveDerbyResponse } from "@/lib/api/derby";

interface Props {
  matchId?: number;
  children: ReactNode;
}

/**
 * Ikiwa mechi hii ni sehemu ya ActiveDerby iliyopo, inaongeza "wrapper"
 * yenye gradient background ya theme ya derby (bila kubadilisha design
 * tokens za msingi — ni overlay ya muda juu ya rangi za kawaida).
 */
export function DerbyThemeProvider({ matchId, children }: Props) {
  const [derby, setDerby] = useState<ActiveDerby | null>(null);

  useEffect(() => {
    getActiveDerby().then((data: ActiveDerbyResponse) => {
      if (data.active && data.derbies.length > 0) {
        // Find the derby that matches this matchId, or use the first one if no matchId provided
        const matchingDerby = matchId
          ? data.derbies.find(d => d.match_id === matchId)
          : data.derbies[0];
        if (matchingDerby) {
          setDerby(matchingDerby);
        }
      }
    });
  }, [matchId]);

  if (!derby) return <>{children}</>;

  return (
    <div style={{ background: `linear-gradient(180deg, ${derby.theme_accent_color}10, transparent 300px)` }}>
      {derby.banner_text && (
        <div
          className="px-5 py-2 text-center text-xs font-bold"
          style={{ background: `${derby.theme_accent_color}22`, color: derby.theme_accent_color }}
        >
          🔥 {derby.banner_text}
        </div>
      )}
      {children}
    </div>
  );
}
