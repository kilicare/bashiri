"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api/admin";
import { useAdminAuthStore } from "@/stores/admin-auth.store";
import { BashiriButton } from "@/components/ui/Button";
import { BashiriInput } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("+255");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(phone, password);
      setSession(data.access, data.refresh, data.user);
      router.push("/admin/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-dvh flex items-center justify-center px-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/admin-bg.jpg')" }}
    >
      <div className="w-full max-w-sm rounded-3xl p-6 backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
        <h1 className="text-xl font-black mb-1" style={{ color: "#00FF87" }}>BASHIRI ADMIN</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>Ingia kama msimamizi wa mfumo.</p>

        <div className="space-y-4">
          <BashiriInput label="Namba ya Simu" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <BashiriInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-xs text-bashiri-red">{error}</p>}
          <BashiriButton className="w-full" size="lg" loading={loading} onClick={handleLogin}>
            Ingia →
          </BashiriButton>
        </div>
      </div>
    </div>
  );
}
