"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { BashiriButton } from "@/components/ui/Button";
import { BashiriInput } from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+255");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(phone, message);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="rounded-3xl p-6"
      style={{ background: "rgba(17,17,17,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {submitted ? (
        <div className="text-center py-4">
          <CheckCircle2 size={40} className="mx-auto mb-4" style={{ color: "#00FF87" }} />
          <h1 className="text-lg font-black text-white mb-2">Ombi Limepokewa</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Timu yetu itawasiliana nawe kupitia namba yako ya simu ndani ya muda mfupi
            kukusaidia kubadilisha password.
          </p>
          <BashiriButton className="w-full" onClick={() => router.push("/login")}>
            Rudi kwenye Login
          </BashiriButton>
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-xl font-black text-white">Umesahau Password?</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Weka namba yako ya simu. Kwa sababu hatuna huduma ya SMS/Email ya moja kwa moja
            kwa sasa, timu yetu itakupigia/kukutumia ujumbe kukusaidia kwa mkono.
          </p>
          <BashiriInput
            label="Namba ya Simu"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255712345678"
          />
          <textarea
            className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-[#151515] outline-none"
            placeholder="Maelezo ya ziada (hiari) — mfano: 'Sikumbuki password yangu tangu wiki iliyopita'"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && <p className="text-xs text-bashiri-red">{error}</p>}
          <BashiriButton className="w-full" size="lg" loading={loading} onClick={handleSubmit}>
            Tuma Ombi →
          </BashiriButton>
          <button className="text-xs w-full text-center" style={{ color: "rgba(255,255,255,0.35)" }} onClick={() => router.push("/login")}>
            Rudi kwenye Login
          </button>
        </div>
      )}
    </motion.div>
  );
}
