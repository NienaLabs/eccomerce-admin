"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NotificationProvider } from "@/context/NotificationContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  adminEmail?: string;
}

export function DashboardLayout({ children, adminEmail }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="h-full flex font-open-sans bg-surface-soft text-ink overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-xl lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} adminEmail={adminEmail} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface-soft p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}
