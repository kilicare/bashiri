"use client";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { InstallPromptSheet } from "@/components/pwa/InstallPromptSheet";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] MainLayout called');
  return (
    <PWAInstallProvider>
      <div className="min-h-dvh pb-24" style={{ background: "#0A0A0A" }}>
        {children}
        <BottomNav />
        <AuthRequiredSheet />
        <InstallPromptSheet />
      </div>
    </PWAInstallProvider>
  );
}