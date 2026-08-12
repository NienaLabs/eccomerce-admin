"use client";

/**
 * design.md §6 button spec, with the §10 touch-target rule baked in: every
 * variant is at least 44px tall so nothing needs to remember to add padding.
 */

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "dark";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders at full width — the default for the mobile thumb zone. */
  block?: boolean;
  icon?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  // The lime glow is exclusive to primary CTAs (design.md §11).
  primary:
    "bg-primary text-ink shadow-[var(--shadow-primary-glow)] hover:bg-primary-dim active:scale-[0.97]",
  secondary:
    "bg-surface text-ink border-[1.5px] border-surface-muted shadow-[var(--shadow-raised-1)] hover:bg-surface-soft hover:border-primary-border",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink",
  destructive:
    "bg-error-ghost text-error border border-error hover:bg-error hover:text-white",
  dark: "bg-ink text-surface hover:bg-ink-soft active:scale-[0.97]",
};

const SIZES: Record<Size, string> = {
  // Still 44px tall — `sm` narrows the horizontal padding, not the hitbox.
  sm: "min-h-11 px-3 text-[13px]",
  md: "min-h-11 px-5 text-sm sm:min-h-12",
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-inter font-semibold transition-all duration-150",
        "disabled:pointer-events-none disabled:bg-surface-muted disabled:text-ink-ghost disabled:shadow-none",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Icon-only action. A bare 16px lucide icon in `p-2` is a 32px target — under
 * the 44px minimum — so this pads the hitbox out without growing the glyph.
 */
export function IconButton({
  label,
  icon,
  tone = "neutral",
  className,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  icon: React.ReactNode;
  tone?: "neutral" | "primary" | "danger" | "info" | "success" | "warning";
}) {
  const tones = {
    neutral: "text-ink-muted hover:bg-surface-muted hover:text-ink",
    primary: "text-ink hover:bg-primary-ghost",
    danger: "text-error hover:bg-error-ghost",
    info: "text-info hover:bg-info-ghost",
    success: "text-success hover:bg-success-ghost",
    warning: "text-warning hover:bg-warning-ghost",
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
        tones[tone],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
