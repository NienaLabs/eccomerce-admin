import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard | Refined Electric",
  description: "Multitenant E-Commerce Admin Dashboard",
};

// Explicit mobile viewport so the responsive breakpoints actually engage on
// phones (renders at device width instead of a zoomed-out desktop width).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* Login uses full viewport; dashboard layout is applied inside (dashboard)/layout.tsx */}
      <body className="h-full bg-surface-soft text-ink">
        {children}
      </body>
    </html>
  );
}
