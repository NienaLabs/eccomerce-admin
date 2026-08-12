"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Bell, LogOut, Trash2, ShieldAlert, BellOff } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { resolveAdminNotificationRoute, type NotificationResponse } from "@/lib/api";
import { findNavItem } from "@/lib/navigation";
import { formatDateTime } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface HeaderProps {
  adminEmail?: string;
}

export function Header({ adminEmail }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    pushPermissionStatus,
    requestPushPermission,
  } = useNotifications();

  const current = findNavItem(pathname);

  const handleOpen = (notif: NotificationResponse) => {
    if (!notif.is_read) markAsRead(notif.id);
    const route = resolveAdminNotificationRoute(notif.action_url);
    if (route) {
      setPanelOpen(false);
      router.push(route);
    }
  };

  return (
    <>
      <header
        className="flex flex-shrink-0 items-center gap-3 border-b border-surface-muted bg-surface px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: "var(--safe-top)",
          height: "calc(4rem + var(--safe-top))",
        }}
      >
        {/* Mobile has no hamburger — navigation lives in the bottom bar — so the
            header carries the wayfinding instead. */}
        <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-primary">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <h2 className="truncate font-inter text-base font-bold text-ink">
            {current?.name ?? "AdminHub"}
          </h2>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <div className="relative">
            <IconButton
              label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              onClick={() => setPanelOpen(true)}
              icon={<Bell className="h-5 w-5" />}
            />
            {unreadCount > 0 && (
              <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-inter text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 border-l border-surface-muted pl-2 sm:pl-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-ghost font-inter text-sm font-bold text-ink">
              {(adminEmail?.[0] ?? "A").toUpperCase()}
            </span>
            <span className="hidden max-w-[160px] truncate font-inter text-sm font-semibold text-ink sm:block">
              {adminEmail || "System Admin"}
            </span>
            <form action={logoutAction}>
              <IconButton
                type="submit"
                label="Sign out"
                tone="danger"
                icon={<LogOut className="h-4 w-4" />}
              />
            </form>
          </div>
        </div>
      </header>

      <Sheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        size="md"
        footer={
          notifications.length > 0 ? (
            <>
              <Button variant="ghost" onClick={clearAll} className="sm:w-auto" block>
                Clear all
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="secondary"
                  onClick={markAllAsRead}
                  className="sm:w-auto"
                  block
                >
                  Mark all read
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {/* Asking for notification permission on mount — which is what this did —
            gets the request auto-blocked in Chrome and Safari, because there's no
            user gesture behind it. It's an explicit opt-in now. */}
        {pushPermissionStatus === "default" && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary-border bg-primary-ghost p-4">
            <div className="min-w-0">
              <p className="font-inter text-sm font-bold text-ink">Push notifications</p>
              <p className="mt-0.5 font-open-sans text-xs text-ink-soft">
                Get alerted on this device when something needs you.
              </p>
            </div>
            <Button size="sm" onClick={requestPushPermission} className="flex-shrink-0">
              Enable
            </Button>
          </div>
        )}

        {pushPermissionStatus === "denied" && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-surface-muted bg-surface-soft p-4">
            <BellOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-muted" />
            <p className="font-open-sans text-xs text-ink-soft">
              Push is blocked for this site. Re-enable it in your browser or system
              notification settings.
            </p>
          </div>
        )}

        {isLoading ? (
          <p className="py-8 text-center font-open-sans text-sm text-ink-muted">Loading…</p>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-10 w-10" />}
            title="No notifications"
            message="Vendor flags, order events and support activity will show up here."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="space-y-1.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`group flex items-start gap-2 rounded-xl p-3 transition-colors ${
                  notif.is_read ? "bg-surface hover:bg-surface-soft" : "bg-primary-ghost"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleOpen(notif)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && (
                      <span
                        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                    <p
                      className={`font-inter text-sm ${
                        notif.is_read ? "text-ink-soft" : "font-semibold text-ink"
                      }`}
                    >
                      {notif.title}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 font-open-sans text-xs text-ink-muted">
                    {notif.body}
                  </p>
                  <p className="mt-1.5 font-open-sans text-[10px] text-ink-ghost">
                    {formatDateTime(notif.created_at)}
                  </p>
                </button>
                <IconButton
                  label="Delete notification"
                  tone="danger"
                  onClick={() => deleteNotification(notif.id)}
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
}
