import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Bashiri — AI Sports Predictions",
  description: "Prediction intelligence tool ya Tanzania — AI predictions, live scores, na jamii ya mpira.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Bashiri",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
    "google": "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] RootLayout called');
  return (
    <html lang="sw">
      <body className="safe-area-shell">
        {children}
        <ServiceWorkerRegister />
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "#151515",
              border: "1px solid rgba(255,71,87,0.35)",
              color: "#FFFFFF",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
