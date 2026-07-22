"use client";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { InstallPromptSheet } from "@/components/pwa/InstallPromptSheet";
import { CommandPaletteProvider } from "@/components/pulse/CommandPaletteProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] MainLayout called');
  return (
    <PWAInstallProvider>
      <div className="min-h-dvh pb-24 bg-background">
        {children}
        <BottomNav />
        <AuthRequiredSheet />
        <InstallPromptSheet />
        <CommandPaletteProvider />
      </div>
    </PWAInstallProvider>
  );
}