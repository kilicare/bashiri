import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="safe-area-shell">
        <QueryProvider>
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
        </QueryProvider>
      </body>
    </html>
  );
}
