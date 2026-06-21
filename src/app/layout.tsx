import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard | Refined Electric",
  description: "Multitenant E-Commerce Admin Dashboard",
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
