"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getActiveDerby, ActiveDerby } from "@/lib/api/derby";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { AlertModal } from "@/components/ui/AlertModal";

const HUB_ITEMS = [
  { key: "stats", label: "Derby Stats" },
  { key: "h2h", label: "Head to Head" },
  { key: "poll", label: "Derby Poll" },
  { key: "room", label: "Derby Room" },
  { key: "history", label: "History" },
  { key: "did-you-know", label: "Did You Know" },
];

function DerbyHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [derby, setDerby] = useState<ActiveDerby | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant: "success" | "error" | "warning" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info"
  });

  useEffect(() => {
    getActiveDerby().then((data) => {
      if (data.active && data.derbies.length > 0) {
        // Get derby ID from URL query parameter, or use the first one
        const derbyId = searchParams.get("id");
        const selectedDerby = derbyId
          ? data.derbies.find(d => d.id === Number(derbyId))
          : data.derbies[0];
        if (selectedDerby) {
          setDerby(selectedDerby);
        }
      }
    });
  }, [searchParams]);

  if (!derby) return (
    <div className="px-4 pt-safe pt-6 flex flex-col items-center justify-center min-h-dvh text-center">
      <div className="text-6xl mb-4">⚽</div>
      <p className="text-xl font-bold text-white mb-2">Hakuna Derby Leo</p>
      <p className="text-sm text-white/60 max-w-xs">
        Kwa sasa hakuna mechi kubwa ya kirivu inayoendelea. Rudi baadaye uone derby inayovuma!
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto min-h-dvh" style={{ background: `linear-gradient(180deg, ${derby.theme_accent_color}15, var(--background) 40%)` }}>
      <div className="px-5 pt-safe pt-10 pb-6 text-center" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: derby.theme_accent_color }}>
          🔥 {derby.derby_name} 🔥
        </p>
        <div className="flex items-center justify-center gap-4 mb-2">
          <p className="text-2xl font-black text-white">{derby.home_team_detail?.name}</p>
          <p className="text-lg" style={{ color: derby.theme_accent_color }}>VS</p>
          <p className="text-2xl font-black text-white">{derby.away_team_detail?.name}</p>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-3 gap-3 pointer-events-auto">
        {HUB_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              if (!derby.match_id) {
                setAlertModal({
                  isOpen: true,
                  title: "Derby Haina Mechi",
                  message: "Derby haina mechi iliyounganishwa. Tafadhali admin alink derby na mechi halisi.",
                  variant: "warning"
                });
                return;
              }
              if (item.key === "room") {
                router.push(`/match/${derby.match_id}/room?derbyId=${derby.id}`);
              } else {
                router.push(`/match/${derby.match_id}/overview?tab=${item.key}&derbyId=${derby.id}`);
              }
            }}
            className="rounded-2xl p-4 text-center cursor-pointer hover:scale-105 transition-transform pointer-events-auto"
            style={{ 
              background: derby.match_id ? "#111111" : "rgba(255,255,255,0.03)", 
              border: `1px solid ${derby.theme_accent_color}33`,
              opacity: derby.match_id ? 1 : 0.5
            }}
          >
            <span className="text-sm font-bold text-white">{item.label}</span>
          </button>
        ))}
      </div>

      {derby.head_to_head && derby.head_to_head.length > 0 && (
        <div className="px-4 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Historia</p>
          <div className="space-y-2">
            {derby.head_to_head.map((h: any, i: number) => (
              <div key={i} className="rounded-2xl p-3 flex items-center justify-between text-xs" style={{ background: "#111111" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{h.date}</span>
                <span className="text-white font-bold">{h.home_team} {h.home_score}-{h.away_score} {h.away_team}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
}

export default function DerbyHubPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-safe pt-6"><CardSkeleton /></div>}>
      <DerbyHubContent />
    </Suspense>
  );
}