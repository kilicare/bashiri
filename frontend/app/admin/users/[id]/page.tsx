"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserDetail, updateUser, getUserPredictions, manualActivateSubscription, deleteUser } from "@/lib/api/admin";
import { BashiriButton } from "@/components/ui/Button";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const [user, setUser] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    getUserDetail(userId).then(setUser);
    getUserPredictions(userId).then(setPredictions);
  }, [userId]);

  async function toggleBan() {
    const updated = await updateUser(userId, { is_active: !user.is_active });
    setUser(updated);
  }

  async function toggleAdmin() {
    const updated = await updateUser(userId, { is_staff: !user.is_staff });
    setUser(updated);
  }

  async function handleManualActivate(plan: "weekly" | "monthly") {
    await manualActivateSubscription({ user_id: userId, plan, reason });
    const refreshed = await getUserDetail(userId);
    setUser(refreshed);
    setReason("");
  }

  async function handleDeleteUser() {
    try {
      await deleteUser(userId);
      router.push("/admin/users");
    } catch (error: any) {
      alert(error.message || "Imeshindwa kufuta mtumiaji");
    }
  }

  if (!user) return <p style={{ color: "rgba(255,255,255,0.5)" }}>Inapakia...</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{user.username?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-white mb-1">@{user.username || "—"}</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{user.phone_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div><p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Accuracy</p><p className="text-lg font-black" style={{ color: "#00FF87" }}>{user.accuracy_percentage}%</p></div>
          <div><p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Streak</p><p className="text-lg font-black text-white">{user.current_streak}🔥</p></div>
          <div><p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Jumla</p><p className="text-lg font-black text-white">{user.total_predictions}</p></div>
          <div><p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>PRO</p><p className="text-lg font-black" style={{ color: user.is_subscription_active ? "#00FF87" : "#FF4757" }}>{user.is_subscription_active ? "Ndiyo" : "Hapana"}</p></div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <BashiriButton variant={user.is_active ? "outline" : "primary"} onClick={toggleBan}>
            {user.is_active ? "Ban Mtumiaji" : "Ondoa Ban"}
          </BashiriButton>
          <BashiriButton variant="outline" onClick={toggleAdmin}>
            {user.is_staff ? "Ondoa Admin" : "Fanya Admin"}
          </BashiriButton>
          <BashiriButton
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ borderColor: "#FF4757", color: "#FF4757" }}
          >
            <Trash2 size={16} className="mr-2" />
            Futa Mtumiaji
          </BashiriButton>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-lg font-black text-white mb-2">Futa Mtumiaji?</h3>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                Una uhakika unataka kufuta mtumiaji @{user.username || "—"}? Hatua hii haiwezi kurudishwa.
              </p>
              <div className="flex gap-3 justify-end">
                <BashiriButton variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Ghairi
                </BashiriButton>
                <BashiriButton
                  onClick={handleDeleteUser}
                  style={{ background: "#FF4757", borderColor: "#FF4757" }}
                >
                  Futa
                </BashiriButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-black text-white mb-3">Amsha Subscription kwa Mkono (Support)</h2>
        <input
          className="w-full rounded-xl px-3 py-2 text-sm text-white bg-[#151515] outline-none mb-3"
          placeholder="Sababu (mfano: malipo yalithibitishwa nje ya app)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <BashiriButton size="md" onClick={() => handleManualActivate("weekly")}>Weekly</BashiriButton>
          <BashiriButton size="md" onClick={() => handleManualActivate("monthly")}>Monthly</BashiriButton>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-black text-white mb-3">Historia ya Predictions</h2>
        {predictions.length === 0 ? (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna predictions bado.</p>
        ) : (
          <div className="space-y-2">
            {predictions.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.market}: {p.selection}</span>
                <span style={{ color: p.is_correct === true ? "#00FF87" : p.is_correct === false ? "#FF4757" : "rgba(255,255,255,0.4)" }}>
                  {p.is_correct === true ? "Sahihi" : p.is_correct === false ? "Makosa" : "Inasubiri"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
