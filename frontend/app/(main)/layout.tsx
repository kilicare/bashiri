"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthRequiredSheet } from "@/components/auth/AuthRequiredSheet";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { InstallPromptSheet } from "@/components/pwa/InstallPromptSheet";
import { CommandPaletteProvider } from "@/components/pulse/CommandPaletteProvider";
import { FloatingWhatsAppButton } from "@/components/contact/FloatingWhatsAppButton";
import { FloatingReviewButton } from "@/components/review/FloatingReviewButton";
import { useAuthStore } from "@/stores/auth.store";
import { getMe } from "@/lib/api/auth";
import { shouldShowOnboarding } from "@/lib/auth/onboarding";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const access = useAuthStore((s) => s.access);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isUserLoading = useAuthStore((s) => s.isUserLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const setUserLoading = useAuthStore((s) => s.setUserLoading);
  const isAIPage = pathname === "/ai";
  const isMicFullMode = pathname.includes("/mic") && searchParams.get("mode") === "full";
  const shouldHideBottomNav = isAIPage || isMicFullMode;
  useEffect(() => {
    if (!hasHydrated) return;
    if (!access) {
      setUserLoading(false);
      return;
    }

    let active = true;
    setUserLoading(true);
    getMe()
      .then((freshUser) => {
        if (active && freshUser) setUser(freshUser);
      })
      .finally(() => {
        if (active) setUserLoading(false);
      });

    return () => {
      active = false;
    };
  }, [access, hasHydrated, setUser, setUserLoading]);

  useEffect(() => {
    if (shouldShowOnboarding(user, {
      hasHydrated,
      isUserLoading,
      isAuthenticated: !!access,
    })) {
      router.push("/onboarding");
    }
  }, [access, hasHydrated, isUserLoading, pathname, router, user]);

  if (!hasHydrated || (access && (isUserLoading || !user))) {
    return <div className="min-h-dvh bg-background flex items-center justify-center" aria-label="Loading" />;
  }

  return (
    <PWAInstallProvider>
      <div className={`min-h-dvh bg-background ${shouldHideBottomNav ? 'pb-0' : 'pb-24'}`}>
        {children}
        {!shouldHideBottomNav && <BottomNav />}
        <AuthRequiredSheet />
        <InstallPromptSheet />
        <CommandPaletteProvider />
        <FloatingReviewButton onClick={() => router.push("/review")} />
        <FloatingWhatsAppButton />
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