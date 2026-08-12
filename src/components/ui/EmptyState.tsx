"use client";

import { cn } from "@/lib/utils";

/**
 * design.md §6 empty-state structure: icon, heading, one-or-two-line body,
 * optional CTA. The spec calls for a Tier 1 3D icon; this dashboard is a dense
 * task surface with no 3D icon set, so it uses the flat icon at display size —
 * documented deviation rather than an accidental one.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-muted bg-surface px-6 py-12 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-ink-ghost">{icon}</div>}
      <h3 className="font-inter text-lg font-semibold text-ink">{title}</h3>
      {message && (
        <p className="mt-2 max-w-sm font-open-sans text-sm text-ink-muted">{message}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
