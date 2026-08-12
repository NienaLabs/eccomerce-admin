import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "AdminHub — Platform Control",
  description: "Multitenant e-commerce admin dashboard",
  applicationName: "AdminHub",
  appleWebApp: {
    capable: true,
    title: "AdminHub",
    // Ink status bar text on the light shell (design.md §4).
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Chrome offers "Open in app" on shared links once installed.
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the layout paint under the notch and home indicator so the
  // `env(safe-area-inset-*)` padding has something to work against.
  viewportFit: "cover",
  themeColor: "#222022",
  // Zoom stays available — pinch-to-zoom is an accessibility requirement, and
  // the 16px touch inputs already prevent iOS's focus-zoom jump.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* Login uses the full viewport; the dashboard chrome is applied in
          (dashboard)/layout.tsx. */}
      <body className="h-full bg-surface-soft text-ink">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
