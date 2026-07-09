"use client";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles, Lock } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BashiriButton } from "@/components/ui/Button";
import { useAuthGateStore } from "@/stores/authGate.store";

export function AuthRequiredSheet() {
  const router = useRouter();
  const { isOpen, message, close } = useAuthGateStore();

  function handleLogin() {
    close();
    router.push("/login");
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={close} title="">
      <div className="flex flex-col items-center text-center py-4">
        {/* Modern gradient icon container */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative overflow-hidden" 
             style={{ 
               background: "linear-gradient(135deg, rgba(0,255,135,0.15) 0%, rgba(0,255,135,0.05) 100%)",
               border: "1px solid rgba(0,255,135,0.2)"
             }}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
          <Lock size={32} style={{ color: "#00FF87" }} />
          <Sparkles size={16} className="absolute top-3 right-3" style={{ color: "#FFD600" }} />
        </div>

        {/* Modern typography */}
        <h2 className="text-xl font-black text-white mb-2">
          Fungua Uwezo Wako
        </h2>
        
        <p className="text-sm leading-relaxed mb-6 max-w-[280px]" 
           style={{ color: "rgba(255,255,255,0.6)" }}>
          {message || "Jisajili kwa dakika chache ili upate uzoefu kamili wa Bashiri."}
        </p>

        {/* Modern CTA button with gradient */}
        <BashiriButton 
          className="w-full" 
          size="lg" 
          onClick={handleLogin}
          style={{
            background: "linear-gradient(135deg, #00FF87 0%, #00CC6A 100%)",
            boxShadow: "0 4px 20px rgba(0,255,135,0.3)"
          }}
        >
          <span className="flex items-center justify-center gap-2">
            Jisajili Sasa <LogIn size={18} />
          </span>
        </BashiriButton>

        {/* Subtle trust indicator */}
        <p className="text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
          • Huru kabisa  • Dakika chache tu  • Hakuna card ya kadi
        </p>
      </div>
    </BottomSheet>
  );
}
