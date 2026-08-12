"use client";

import { cn } from "@/lib/utils";

/** design.md §6: skeletons mirror the real shape — never generic grey boxes. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} aria-hidden="true" />;
}

/** Placeholder matching the mobile card list produced by `DataView`. */
export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-2)]"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
