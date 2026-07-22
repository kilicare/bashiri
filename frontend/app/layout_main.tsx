"use client";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] MainLayout called');
  return (
    <div className="min-h-dvh pb-24 bg-background">
      {children}
      <BottomNav />
      <AuthRequiredSheet />
    </div>
  );
}