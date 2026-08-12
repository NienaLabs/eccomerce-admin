"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, isActiveRoute } from "@/lib/navigation";

interface SidebarProps {
  onClose?: () => void;
}

/**
 * Desktop drawer, 280px per design.md §5. The sixteen destinations are grouped
 * into six labelled sections — as one flat list they were impossible to scan.
 */
export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-70 flex-col border-r border-surface-muted bg-surface shadow-[var(--shadow-raised-1)]">
      <div
        className="flex h-16 flex-shrink-0 items-center justify-between border-b border-surface-muted px-5"
        style={{ paddingTop: "var(--safe-top)", height: "calc(4rem + var(--safe-top))" }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-primary">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <span className="font-inter text-lg font-bold text-ink">AdminHub</span>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close navigation"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 font-inter text-[11px] font-bold uppercase tracking-[0.05em] text-ink-ghost">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isActiveRoute(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 font-inter text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary-ghost text-ink"
                        : "border-transparent text-ink-soft hover:bg-surface-soft hover:text-ink"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-ink" : "text-ink-muted group-hover:text-ink"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
