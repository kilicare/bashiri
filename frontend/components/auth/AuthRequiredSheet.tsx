"use client";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
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
    <BottomSheet isOpen={isOpen} onClose={close} title="Ingia Kwanza">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(0,255,135,0.1)" }}>
          <LogIn size={24} style={{ color: "#00FF87" }} />
        </div>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>{message}</p>
        <BashiriButton className="w-full" size="lg" onClick={handleLogin}>
          Ingia / Jisajili →
        </BashiriButton>
      </div>
    </BottomSheet>
  );
}
