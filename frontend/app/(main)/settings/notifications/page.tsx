"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from "@/lib/api/notifications";
import { ArrowLeft } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const TOGGLES: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "daily_picks_enabled", label: "AI Picks za Kila Siku" },
  { key: "favorite_team_alerts_enabled", label: "Mechi za Timu Ninazopenda" },
  { key: "high_confidence_alerts_enabled", label: "High-Confidence Alerts" },
  { key: "result_alerts_enabled", label: "Matokeo ya Mechi" },
];

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-6 rounded-full relative transition-colors"
      style={{ background: active ? "#00FF87" : "rgba(255,255,255,0.15)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: active ? "22px" : "2px" }}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const { enablePush } = usePushNotifications();
  const [pushEnabled, setPushEnabled] = useState(
    typeof window !== "undefined" && Notification?.permission === "granted"
  );

  useEffect(() => {
    getNotificationPreferences().then(setPrefs);
  }, []);

  async function handleEnablePush() {
    const ok = await enablePush();
    setPushEnabled(ok);
  }

  async function toggle(key: keyof NotificationPreferences) {
    if (!prefs) return;
    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue }); // optimistic update
    try {
      await updateNotificationPreferences({ [key]: newValue });
    } catch {
      setPrefs(prefs); // rudisha nyuma ikiwa imeshindwa
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-5 pt-safe pt-10 pb-4 flex items-center gap-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Notifications</h1>
      </div>

      <div className="px-4 space-y-2">
        {!pushEnabled && (
          <button
            onClick={handleEnablePush}
            className="w-full rounded-2xl p-4 mb-3 text-left"
            style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)" }}
          >
            <p className="text-sm font-bold" style={{ color: "#00FF87" }}>🔔 Washa Push Notifications</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Pokea taarifa hata app ikiwa imefungwa
            </p>
          </button>
        )}

        {!prefs ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : (
          TOGGLES.map((t) => (
            <div key={t.key} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-sm font-bold text-white">{t.label}</span>
              <Toggle active={prefs[t.key]} onClick={() => toggle(t.key)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
