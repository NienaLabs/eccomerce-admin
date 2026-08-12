"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_SECTIONS,
  BOTTOM_NAV_HREFS,
  ALL_NAV_ITEMS,
  isActiveRoute,
} from "@/lib/navigation";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Mobile primary navigation — design.md §5.
 *
 * Reaching any of sixteen screens previously meant: tap hamburger, wait for the
 * drawer, scroll a flat list, tap. Four destinations now sit permanently in the
 * thumb zone and the rest are one tap away in a grouped sheet.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = BOTTOM_NAV_HREFS.map((href) =>
    ALL_NAV_ITEMS.find((item) => item.href === href)
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  // "More" reads as active whenever the current screen isn't one of the tabs.
  const onTabRoute = tabs.some((tab) => isActiveRoute(pathname, tab.href));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-muted bg-surface shadow-[0_-2px_12px_rgba(34,32,34,0.06)] lg:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="flex h-16 items-stretch">
          {tabs.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1 pt-1 transition-colors"
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px]",
                    isActive ? "text-ink" : "text-ink-ghost"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "font-inter text-[10px] font-bold uppercase tracking-wider",
                    isActive ? "text-ink" : "text-ink-ghost"
                  )}
                >
                  {item.shortName ?? item.name}
                </span>
                {/* design.md §5: 4px primary dot marks the active tab. */}
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isActive ? "bg-primary" : "bg-transparent"
                  )}
                  aria-hidden="true"
                />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More destinations"
            aria-expanded={moreOpen}
            className="flex flex-1 flex-col items-center justify-center gap-1 pt-1 transition-colors"
          >
            <LayoutGrid
              className={cn(
                "h-[22px] w-[22px]",
                !onTabRoute ? "text-ink" : "text-ink-ghost"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "font-inter text-[10px] font-bold uppercase tracking-wider",
                !onTabRoute ? "text-ink" : "text-ink-ghost"
              )}
            >
              More
            </span>
            <span
              className={cn(
                "h-1 w-1 rounded-full",
                !onTabRoute ? "bg-primary" : "bg-transparent"
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="All destinations"
        size="lg"
      >
        <div className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="pb-2 font-inter text-[11px] font-bold uppercase tracking-[0.05em] text-ink-ghost">
                {section.label}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border p-3 transition-colors",
                        isActive
                          ? "border-primary-border bg-primary-ghost"
                          : "border-surface-muted bg-surface hover:bg-surface-soft"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                          isActive ? "bg-surface text-ink" : "bg-surface-soft text-ink-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-inter text-sm font-semibold text-ink">
                          {item.name}
                        </span>
                        <span className="block truncate font-open-sans text-xs text-ink-muted">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}
