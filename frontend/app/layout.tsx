import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bashiri — AI Sports Predictions",
  description: "Prediction intelligence tool ya Tanzania",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] RootLayout called');
  return (
    <html lang="sw">
      <body>{children}</body>
    </html>
  );
}
