"use client";

/** design.md §6 status badge: pill, Label S (Inter Bold, all caps), ghost fill. */

import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info" | "primary" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-success-ghost text-success",
  warning: "bg-warning-ghost text-warning",
  error: "bg-error-ghost text-error",
  info: "bg-info-ghost text-info",
  // design.md §2: ink on primary-ghost, never primary as small text.
  primary: "bg-primary-ghost text-ink",
  neutral: "bg-surface-muted text-ink-soft",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-wider",
        TONES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
