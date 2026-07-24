"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { InstallPromptSheet } from "@/components/pwa/InstallPromptSheet";
import { CommandPaletteProvider } from "@/components/pulse/CommandPaletteProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAIPage = pathname === "/ai";
  const isMicFullMode = pathname.includes("/mic") && searchParams.get("mode") === "full";
  const shouldHideBottomNav = isAIPage || isMicFullMode;
  console.log('[TRACE] MainLayout called');
  return (
    <PWAInstallProvider>
      <div className={`min-h-dvh bg-background ${shouldHideBottomNav ? 'pb-0' : 'pb-20'}`}>
        {children}
        {!shouldHideBottomNav && <BottomNav />}
        <AuthRequiredSheet />
        <InstallPromptSheet />
        <CommandPaletteProvider />
      </div>
    </PWAInstallProvider>
  );
}