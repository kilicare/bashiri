"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { BashiriButton } from "@/components/ui/Button";
import { initiateSubscription, getTransactionStatus } from "@/lib/api/payments";
import { useAuthStore } from "@/stores/auth.store";
import { getMe } from "@/lib/api/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Stage = "confirm" | "waiting" | "success" | "failed";

const PLAN_DETAILS: Record<string, { label: string; price: string }> = {
  weekly: { label: "Wiki 1", price: "TZS 1,500" },
  monthly: { label: "Mwezi 1", price: "TZS 6,000" },
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 30; // dakika 1.5 (30 x 3s)

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requireAuth } = useRequireAuth();
  const plan = (searchParams.get("plan") || "monthly") as "weekly" | "monthly";
  const rawReturnTo = searchParams.get("return_to");
  const returnTo = rawReturnTo && rawReturnTo.startsWith("/") ? rawReturnTo : "/profile";
  const { user, setUser } = useAuthStore();

  const [stage, setStage] = useState<Stage>("confirm");
  const [error, setError] = useState("");
  const pollCountRef = useRef(0);
  const checkoutIdRef = useRef<string>("");

  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.monthly;

  useEffect(() => {
    if (!requireAuth("Jiunge na Bashiri PRO — fungua masoko yote!")) {
      router.push("/home");
      return;
    }
  }, [requireAuth, router]);

  async function handlePay() {
    setError("");
    setStage("waiting");
    try {
      const res = await initiateSubscription(plan);
      checkoutIdRef.current = res.checkout_request_id;
      pollStatus();
    } catch (e: any) {
      setError(e.message);
      setStage("failed");
    }
  }

  function pollStatus() {
    const interval = setInterval(async () => {
      pollCountRef.current += 1;

      try {
        const txn = await getTransactionStatus(checkoutIdRef.current);

        if (txn.status === "SUCCESS") {
          clearInterval(interval);
          const freshUser = await getMe();
          setUser(freshUser);
          setStage("success");
        } else if (txn.status === "FAILED" || txn.status === "CANCELLED") {
          clearInterval(interval);
          setError(txn.result_desc || "Malipo hayajakamilika.");
          setStage("failed");
        } else if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          clearInterval(interval);
          setError("Muda wa kusubiri umeisha. Angalia Profile baadaye au jaribu tena.");
          setStage("failed");
        }
      } catch {
        // endelea kusubiri, usiache polling kwa error moja ya mtandao
      }
    }, POLL_INTERVAL_MS);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 pt-safe pt-6 bg-background">
      {stage === "confirm" && (
        <motion.div className="w-full max-w-sm text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-white mb-2">Thibitisha Malipo</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            {planInfo.label} — <span className="font-bold text-white">{planInfo.price}</span>
          </p>
          <div className="rounded-2xl p-4 mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Utatumiwa STK Push kwenye:</p>
            <p className="text-lg font-black text-white">{user?.phone_number}</p>
          </div>
          {error && <p className="text-xs text-bashiri-red mb-4">{error}</p>}
          <BashiriButton className="w-full" size="lg" onClick={handlePay}>
            Lipa Sasa →
          </BashiriButton>
          <button className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.35)" }} onClick={() => router.back()}>
            Ghairi
          </button>
        </motion.div>
      )}

      {stage === "waiting" && (
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: "#00FF87" }} />
          <h1 className="text-xl font-black text-white mb-2">Angalia Simo Yako</h1>
          <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Utapokea ujumbe wa M-Pesa STK Push. Weka PIN yako kukamilisha malipo.
          </p>
        </motion.div>
      )}

      {stage === "success" && (
        <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle2 size={56} className="mx-auto mb-4" style={{ color: "#00FF87" }} />
          <h1 className="text-2xl font-black text-white mb-2">Umefanikiwa! 🎉</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Masoko yote yamefunguliwa. Karibu Bashiri PRO.
          </p>
          <BashiriButton className="w-full" onClick={() => router.push("/profile")}>
            Nenda Profile →
          </BashiriButton>
        </motion.div>
      )}

      {stage === "failed" && (
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <XCircle size={56} className="mx-auto mb-4" style={{ color: "#FF4757" }} />
          <h1 className="text-xl font-black text-white mb-2">Malipo Hayajakamilika</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{error}</p>
          <BashiriButton className="w-full" onClick={() => setStage("confirm")}>
            Jaribu Tena
          </BashiriButton>
        </motion.div>
      )}
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-white">Loading...</div>}>
      <SubscribeContent />
    </Suspense>
  );
}