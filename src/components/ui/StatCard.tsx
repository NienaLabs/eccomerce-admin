"use client";

import { cn } from "@/lib/utils";

/** Metric tile. Pass numbers through `LocaleNumber` so formatting stays deterministic. */
export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "error" | "info";
  hint?: string;
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-muted text-ink-muted",
    primary: "bg-primary-ghost text-ink",
    success: "bg-success-ghost text-success",
    warning: "bg-warning-ghost text-warning",
    error: "bg-error-ghost text-error",
    info: "bg-info-ghost text-info",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-1)] sm:p-5",
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10",
            tones[tone]
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          {label}
        </p>
        {/* Prices and key numbers always Inter Bold (design.md §3). */}
        <p className="mt-1 truncate font-inter text-2xl font-bold text-ink sm:text-3xl">
          {value}
        </p>
        {hint && <p className="mt-0.5 font-open-sans text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}
