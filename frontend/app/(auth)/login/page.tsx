"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BashiriButton } from "@/components/ui/Button";
import { BashiriInput } from "@/components/ui/Input";
import { register, login } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth.store";
import { consumeReturnTo } from "@/lib/return-to";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [tab, setTab] = useState<Tab>("login");
  const [phone, setPhone] = useState("+255");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const data = await login(phone, password);
      setSession(data.access, data.refresh, data.user);
      router.push(consumeReturnTo() || "/home");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const data = await register({
        phone_number: phone,
        password,
        confirm_password: confirmPassword,
        username,
        date_of_birth: dob,
      });
      setSession(data.access, data.refresh, data.user);
      router.push(consumeReturnTo() || "/onboarding");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="rounded-3xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab("login"); setError(""); }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: tab === "login" ? "var(--color-gold)" : "rgba(255,255,255,0.06)", color: tab === "login" ? "#000" : "rgba(255,255,255,0.5)" }}
        >
          Ingia
        </button>
        <button
          onClick={() => { setTab("register"); setError(""); }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: tab === "register" ? "var(--color-gold)" : "rgba(255,255,255,0.06)", color: tab === "register" ? "#000" : "rgba(255,255,255,0.5)" }}
        >
          Jisajili
        </button>
      </div>

      {tab === "login" && (
        <div className="space-y-4">
          <h1 className="text-xl font-black text-white">Karibu Tena</h1>
          <BashiriInput
            label="Namba ya Simu"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255712345678"
          />
          <BashiriInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle
          />
          {error && <p className="text-xs text-bashiri-red">{error}</p>}
          <BashiriButton className="w-full" size="lg" loading={loading} onClick={handleLogin}>
            Ingia →
          </BashiriButton>
          <button
            className="text-xs w-full text-center"
            style={{ color: "var(--color-gold)" }}
            onClick={() => router.push("/forgot-password")}
          >
            Umesahau Password?
          </button>
        </div>
      )}

      {tab === "register" && (
        <div className="space-y-4">
          <h1 className="text-xl font-black text-white">Tengeneza Akaunti</h1>
          <BashiriInput
            label="Namba ya Simu"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255712345678"
          />
          <BashiriInput label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mfano: lastmateru" />
          <BashiriInput label="Tarehe ya Kuzaliwa" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <BashiriInput
            label="Password (angalau herufi 4)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle
          />
          <BashiriInput
            label="Rudia Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showPasswordToggle
          />
          {error && <p className="text-xs text-bashiri-red">{error}</p>}
          <BashiriButton className="w-full" size="lg" loading={loading} onClick={handleRegister}>
            Jisajili →
          </BashiriButton>
        </div>
      )}
    </motion.div>
  );
}

/*
// ============================================================
// OTP FLOW (Hatua za Awali: phone -> OTP -> profile) — COMMENTED
// ============================================================
// Muundo wa awali ulikuwa na "step" state ("phone" | "otp" | "profile"),
// requestOTP()/verifyOTP() kutoka lib/api/auth.ts, na JSX ya hatua tatu.
// Ukirudisha OTP kazini, angalia historia ya Git (commit ya kabla ya
// mabadiliko haya) kupata muundo kamili wa awali.
*/