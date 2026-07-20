"use client";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] MainLayout called');
  return (
    <div className="min-h-dvh pb-24" style={{ background: "#09090B", minHeight: "100dvh" }}>
      {children}
      <BottomNav />
      <AuthRequiredSheet />
    </div>
  );
}