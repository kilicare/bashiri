"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BashiriButton } from "@/components/ui/Button";
import { BashiriInput } from "@/components/ui/Input";
import { BashiriDateInput } from "@/components/ui/DateInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { register, login } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth.store";
import { consumeReturnTo } from "@/lib/return-to";
import { isNetworkError, showNetworkErrorToast } from "@/lib/toast-utils";

type Tab = "login" | "register";

const isPhoneValid = (value: string) => /^\+255\d{9}$/.test(value);

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [tab, setTab] = useState<Tab>("login");
  const [registerStep, setRegisterStep] = useState(1);
  const [phone, setPhone] = useState("+255");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");

    if (!isPhoneValid(phone)) {
      setError("Namba ya simu si sahihi. Andika kwa muundo +255712345678");
      return;
    }

    if (!password) {
      setError("Weka password yako ili kuingia");
      return;
    }

    setLoading(true);
    try {
      const data = await login(phone, password);
      setSession(data.access, data.refresh, data.user);
      // Redirect to onboarding if profile is not complete, otherwise home
      if (!data.profile_complete) {
        router.push(consumeReturnTo() || "/onboarding");
      } else {
        router.push(consumeReturnTo() || "/home");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hitilafu wakati wa kuingia");
      if (isNetworkError(e)) showNetworkErrorToast();
    } finally {
      setLoading(false);
    }
  }

  function handleNextStep() {
    setError("");
    if (registerStep === 1) {
      if (!isPhoneValid(phone) || !username || !dob) {
        setError("Tafadhali jaza sehemu zote na weka namba sahihi ya simu");
        return;
      }
      setRegisterStep(2);
    }
  }

  function handleBackStep() {
    setError("");
    setRegisterStep(1);
  }

  async function handleRegister() {
    setError("");

    if (!password || !confirmPassword) {
      setError("Weka password na hakikisha umeirudia");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password hazilingani");
      return;
    }

    if (password.length < 4) {
      setError("Password inapaswa kuwa na angalau herufi 4");
      return;
    }

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
      // Always redirect to onboarding for new registrations
      router.push(consumeReturnTo() || "/onboarding");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Hitilafu wakati wa kusajili";
      // If error is about username, go back to step 1
      if (errorMessage.toLowerCase().includes("username") || errorMessage.toLowerCase().includes("inatumika")) {
        setRegisterStep(1);
      }
      setError(errorMessage);
      if (isNetworkError(e)) showNetworkErrorToast();
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
          onClick={() => { setTab("register"); setError(""); setRegisterStep(1); }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: tab === "register" ? "var(--color-gold)" : "rgba(255,255,255,0.06)", color: tab === "register" ? "#000" : "rgba(255,255,255,0.5)" }}
        >
          Jisajili
        </button>
      </div>

      {tab === "login" && (
        <div className="space-y-4">
          <h1 className="text-xl font-black text-white">Karibu Tena</h1>
          <PhoneInput label="Namba ya Simu" value={phone} onChange={setPhone} />
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
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{ 
                  background: registerStep >= 1 ? "var(--color-gold)" : "rgba(255,255,255,0.1)",
                  color: registerStep >= 1 ? "#000" : "rgba(255,255,255,0.5)"
                }}
              >
                1
              </div>
              <div 
                className="w-12 h-1 rounded-full transition-all"
                style={{ background: registerStep >= 2 ? "var(--color-gold)" : "rgba(255,255,255,0.1)" }}
              />
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{ 
                background: registerStep >= 2 ? "var(--color-gold)" : "rgba(255,255,255,0.1)",
                color: registerStep >= 2 ? "#000" : "rgba(255,255,255,0.5)"
              }}
            >
              2
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {registerStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
                  <PhoneInput label="Namba ya Simu" value={phone} onChange={setPhone} />
              <BashiriInput label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mfano: lastmateru" />
              <BashiriDateInput label="Tarehe ya Kuzaliwa" value={dob} onChange={setDob} />
              {error && <p className="text-xs text-bashiri-red">{error}</p>}
              <BashiriButton className="w-full" size="lg" onClick={handleNextStep}>
                Endelea →
              </BashiriButton>
            </motion.div>
          )}

          {/* Step 2: Password */}
          {registerStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
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
              <button
                className="text-xs w-full text-center"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onClick={handleBackStep}
              >
                ← Rudi
              </button>
            </motion.div>
          )}
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