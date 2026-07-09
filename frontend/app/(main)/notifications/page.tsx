"use client";
import { useEffect, useState } from "react";
import { getNotifications, markRead } from "@/lib/api/notifications";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function NotificationsPage() {
  const { requireAuth } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth("Fungua notifications zako — jisajili kwa dakika chache!")) {
      router.push("/home");
      return;
    }
    if (user) {
      getNotifications().then((data) => { 
        if (data) {
          setItems(data); 
        }
        setLoading(false); 
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [user, requireAuth, router]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-5 pt-safe pt-6 pb-4"><h1 className="text-2xl font-black text-white">Notifications</h1></div>
      <div className="px-4 space-y-2">
        {loading ? [1, 2].map((i) => <CardSkeleton key={i} />) : items.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna notifications bado.</p>
        ) : items.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className="w-full text-left rounded-2xl p-4"
            style={{ background: n.is_read ? "#111111" : "rgba(0,255,135,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm font-bold text-white mb-1">{n.title}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{n.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}