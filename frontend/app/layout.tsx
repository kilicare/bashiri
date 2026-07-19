import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Bashiri — AI Sports Predictions",
  description: "Prediction intelligence tool ya Tanzania — AI predictions, live scores, na jamii ya mpira.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bashiri",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00FF87",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log('[TRACE] RootLayout called');
  return (
    <html lang="sw">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
