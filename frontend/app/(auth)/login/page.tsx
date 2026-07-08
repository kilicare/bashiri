"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/Button";
import { BashiriInput } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { requestOTP, verifyOTP, completeProfile } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth.store";
import { ArrowLeft, Shield, User, Calendar } from "lucide-react";
import { clsx } from "clsx";

type Step = "phone" | "otp" | "profile";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [dobError, setDobError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp() {
    setError("");
    setLoading(true);
    try {
      if (!phone || phone === "+255") {
        setError("Tafadhali weka namba ya simu");
        setLoading(false);
        return;
      }
      await requestOTP(phone);
      setStep("otp");
    } catch (e: any) {
      if (e.message && e.message.includes("phone_number")) {
        setError("Namba ya simu inahitajika. Tafadhali weka namba sahihi");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);
    try {
      const data = await verifyOTP(phone, code);
      setSession(data.access, data.refresh, data.user);
      if (data.profile_complete) {
        router.push("/home");
      } else {
        setStep("profile");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile() {
    setError("");
    setUsernameError("");
    setDobError("");
    setLoading(true);
    try {
      if (!username || username.trim().length === 0) {
        setUsernameError("Username inahitajika");
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setUsernameError("Username lazima uwe na herufi 3 au zaidi");
        setLoading(false);
        return;
      }

      if (!dob) {
        setDobError("Tarehe ya kuzaliwa inahitajika");
        setLoading(false);
        return;
      }

      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;

      if (finalAge < 18) {
        setDobError("Lazima uwe na miaka 18 au zaidi kujiunga na Bashiri");
        setLoading(false);
        return;
      }

      const user = await completeProfile(username, dob);
      setUser(user);
      router.push("/onboarding");
    } catch (e: any) {
      if (e.message && (e.message.includes("username") || e.message.includes("already exists") || e.message.includes("taken") || e.message.includes("inatumika"))) {
        setUsernameError(e.message);
      } else if (e.message && e.message.includes("date_of_birth")) {
        setDobError(e.message);
      } else if (e.message && e.message.includes("required")) {
        setError("Tafadhali jaza sehemu zote zinazohitajika");
      } else {
        setError(e.message || "Imeshindwa kukamilisha profile. Tafadhali jaribu tena");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Premium Card Container */}
      <div className="rounded-3xl p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
        {step === "phone" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
                Karibu
              </h1>
              <p className="text-base text-white/60 leading-relaxed">
                Weka namba yako ya simu kuingia au kujisajili.
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80">Namba ya Simu</label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                error={error}
                className="bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {error}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <PremiumButton 
              variant="primary" 
              size="xl" 
              fullWidth 
              loading={loading} 
              onClick={handleRequestOtp}
              className="shadow-lg shadow-purple-500/25"
            >
              Tuma OTP
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </PremiumButton>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-8">
            {/* Back Button */}
            <button 
              onClick={() => setStep("phone")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Rudi</span>
            </button>

            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FFD54A]/20 to-[#FFB300]/10 flex items-center justify-center border border-[#FFD54A]/20">
                <Shield size={32} className="text-[#FFD54A]" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
                Weka OTP
              </h1>
              <p className="text-base text-white/60 leading-relaxed">
                Tumetuma namba ya uthibitisho kwa <span className="text-[#FFD54A] font-semibold">{phone}</span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80">Namba ya uthibitisho</label>
              <BashiriInput
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                error={error}
                className="bg-white/5 border-white/10 focus:border-[#FFD54A]/50 focus:ring-[#FFD54A]/20 text-center text-2xl tracking-widest"
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {error}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <PremiumButton 
              variant="gold" 
              size="xl" 
              fullWidth 
              loading={loading} 
              onClick={handleVerifyOtp}
              className="shadow-lg shadow-yellow-500/25"
            >
              Thibitisha
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </PremiumButton>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border border-green-500/20">
                <User size={32} className="text-green-400" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
                Kamilisha Profile
              </h1>
              <p className="text-base text-white/60 leading-relaxed">
                Jaza maelezo yako kuendelea.
              </p>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <User size={16} className="text-white/60" />
                Username
              </label>
              <BashiriInput 
                value={username} 
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
                placeholder="lastmateru" 
                error={usernameError}
                className="bg-white/5 border-white/10 focus:border-green-500/50 focus:ring-green-500/20"
              />
              {usernameError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {usernameError}
                </motion.p>
              )}
            </div>

            {/* Date of Birth Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Calendar size={16} className="text-white/60" />
                Tarehe ya Kuzaliwa
              </label>
              <BashiriInput 
                type="date" 
                value={dob} 
                onChange={(e) => {
                  setDob(e.target.value);
                  setDobError("");
                }}
                error={dobError}
                className="bg-white/5 border-white/10 focus:border-green-500/50 focus:ring-green-500/20"
              />
              {dobError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {dobError}
                </motion.p>
              )}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <PremiumButton 
              variant="primary" 
              size="xl" 
              fullWidth 
              loading={loading} 
              onClick={handleCompleteProfile}
              className="shadow-lg shadow-purple-500/25"
            >
              Endelea
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </PremiumButton>
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
}