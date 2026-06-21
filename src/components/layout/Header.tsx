import { logoutAction } from "@/app/actions/auth";
import { Menu, Bell, LogOut } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  adminEmail?: string;
}

export function Header({ onMenuClick, adminEmail }: HeaderProps) {
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
        <button className="text-ink-muted hover:text-ink transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

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
