"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { InstallPromptSheet } from "@/components/pwa/InstallPromptSheet";
import { CommandPaletteProvider } from "@/components/pulse/CommandPaletteProvider";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAIPage = pathname === "/ai";
  const isMicFullMode = pathname.includes("/mic") && searchParams.get("mode") === "full";
  const shouldHideBottomNav = isAIPage || isMicFullMode;
  console.log('[TRACE] MainLayout called');
  return (
    <PWAInstallProvider>
      <div className={`min-h-dvh bg-background ${shouldHideBottomNav ? 'pb-0' : 'pb-24'}`}>
        {children}
        {!shouldHideBottomNav && <BottomNav />}
        <AuthRequiredSheet />
        <InstallPromptSheet />
        <CommandPaletteProvider />
      </div>
    </PWAInstallProvider>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background pb-20" />}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  );
}