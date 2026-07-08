"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { PremiumBottomNav } from "@/components/navigation/PremiumBottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-24" style={{ background: "#0A0A0A" }}>
      {children}
      <PremiumBottomNav />
    </div>
  );
}