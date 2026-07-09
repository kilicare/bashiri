"use client";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-24" style={{ background: "#0A0A0A" }}>
      {children}
      <BottomNav />
      <AuthRequiredSheet />
    </div>
  );
}