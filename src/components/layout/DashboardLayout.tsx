"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { InstallPrompt } from "./InstallPrompt";
import { NotificationProvider } from "@/context/NotificationContext";
import { FeedbackProvider } from "@/components/ui/Feedback";

interface DashboardLayoutProps {
  children: React.ReactNode;
  adminEmail?: string;
}

export function DashboardLayout({ children, adminEmail }: DashboardLayoutProps) {
  return (
    <FeedbackProvider>
      <NotificationProvider>
        <div
          className="flex h-dvh overflow-hidden bg-surface-soft font-open-sans text-ink"
          style={{
            paddingLeft: "var(--safe-left)",
            paddingRight: "var(--safe-right)",
          }}
        >
          {/* Desktop only. On mobile the bottom bar is the primary navigation,
              so there is no drawer to slide in and no overlay to dismiss. */}
          <aside className="hidden flex-shrink-0 lg:block">
            <Sidebar />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header adminEmail={adminEmail} />

            <main
              className="main-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:p-6 lg:p-8"
            >
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>

          <BottomNav />
          <InstallPrompt />
        </div>
      </NotificationProvider>
    </FeedbackProvider>
  );
}
