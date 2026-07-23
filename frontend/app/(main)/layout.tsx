"use client";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { InstallPromptSheet } from "@/components/pwa/InstallPromptSheet";
import { CommandPaletteProvider } from "@/components/pulse/CommandPaletteProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAIPage = pathname === "/ai";
  console.log('[TRACE] MainLayout called');
  return (
    <PWAInstallProvider>
      <div className={`min-h-dvh bg-background ${isAIPage ? 'pb-0' : 'pb-20'}`}>
        {children}
        {!isAIPage && <BottomNav />}
        <AuthRequiredSheet />
        <InstallPromptSheet />
        <CommandPaletteProvider />
      </div>
    </PWAInstallProvider>
  );
}