import { useState, useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Menu, Bell, LogOut } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

interface HeaderProps {
  onMenuClick?: () => void;
  adminEmail?: string;
}

export function Header({ onMenuClick, adminEmail }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, pushPermissionStatus, requestPushPermission } = useNotifications();

  useEffect(() => {
    if (pushPermissionStatus === 'default') {
      requestPushPermission();
    }
  }, [pushPermissionStatus, requestPushPermission]);

  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-surface-muted bg-surface px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Menu Toggle */}
      <button
        type="button"
        className="lg:hidden p-2 -m-2 text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
        {/* Notification Dropdown Container */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-ink-muted hover:text-ink transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary relative"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-lg bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 flex flex-col max-h-[80vh]">
              <div className="px-4 py-3 border-b border-surface-muted flex justify-between items-center">
                <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary-dark font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {pushPermissionStatus === 'default' && (
                  <div className="m-2 p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-between">
                    <div className="text-sm text-ink-soft">
                      <strong className="block text-ink">Push Notifications</strong>
                      Enable alerts
                    </div>
                    <button
                      onClick={requestPushPermission}
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark transition-colors font-medium"
                    >
                      Enable
                    </button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="text-center py-4 text-ink-muted text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted text-sm">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        notif.is_read ? 'bg-transparent hover:bg-surface-soft' : 'bg-primary/5 hover:bg-primary/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm ${notif.is_read ? 'text-ink-soft' : 'text-ink font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-1 line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-ink-ghost mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile & Logout */}
        <div className="flex items-center gap-x-3 pl-4 border-l border-surface-muted">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-inter font-bold text-ink text-sm">
            A
          </div>
          <span className="hidden sm:block text-sm font-semibold text-ink font-inter truncate max-w-[120px]">
            {adminEmail || "System Admin"}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="p-2 text-ink-muted hover:text-error transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-error"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
