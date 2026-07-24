"use client";
import dynamic from "next/dynamic";

// ssr: false ni MUHIMU — inahakikisha sessionStorage inasomwa client-side
// pekee, bila hatari ya hydration mismatch kati ya server na browser.
const BashiriSplash = dynamic(
  () => import("@/components/splash/BashiriSplash").then((m) => m.BashiriSplash),
  { ssr: false }
);

export default function RootPage() {
  return <BashiriSplash />;
}
