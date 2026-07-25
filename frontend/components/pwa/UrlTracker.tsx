"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hifadhi URL ya mwisho kwenye localStorage ili user aweze kurudi pale alipokuwa
 * baada ya kutoka offline
 */
export function UrlTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Hifadhi current URL kwenye localStorage
    localStorage.setItem("lastUrl", pathname);
  }, [pathname]);

  return null;
}
