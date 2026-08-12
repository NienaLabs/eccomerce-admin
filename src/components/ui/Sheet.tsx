"use client";

/**
 * One overlay primitive for both form factors.
 *
 * design.md §6 specifies two different presentations for the same job: a bottom
 * sheet on mobile (top corners rounded, slides up, drag handle) and a centered
 * dialog on web (scales in, max 480px). Rather than every screen shipping its
 * own `fixed inset-0` div — which is what the dashboard did, in nine places —
 * this renders whichever the viewport calls for.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Sticky action row pinned to the bottom on mobile. */
  footer?: React.ReactNode;
  /** Desktop dialog width. Mobile always goes full-bleed. */
  size?: "sm" | "md" | "lg";
  /** Tone of the header band — `danger` for destructive confirmations. */
  tone?: "default" | "danger";
}

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  tone = "default",
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Callers pass `onClose` as an inline arrow, so it is a new function on every
  // render. Depending on it directly re-ran the effect below on every keystroke
  // — which re-focused the panel and yanked the caret out of whatever input the
  // admin was typing into. Holding it in a ref keeps the effect keyed on `open`
  // alone while still calling the latest handler.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes, and the page behind must not scroll while we're open —
  // on iOS a scrolling background under a sheet feels broken.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel once, on open, so screen readers and keyboards
    // land here. Never on subsequent renders.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[4px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex w-full flex-col bg-surface outline-none",
          // Mobile: bottom sheet, never taller than 92% so the page peeks through.
          "max-h-[92dvh] rounded-t-3xl animate-sheet-up",
          // Desktop: centered dialog.
          "sm:max-h-[85vh] sm:rounded-2xl sm:border sm:border-surface-muted sm:animate-dialog-in sm:shadow-[var(--shadow-raised-5)]",
          SIZES[size]
        )}
      >
        {/* Drag handle — mobile affordance only. */}
        <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-surface-deep" />
        </div>

        {title && (
          <div
            className={cn(
              "flex items-start justify-between gap-4 border-b px-6 py-4",
              tone === "danger"
                ? "border-error-ghost bg-error-ghost"
                : "border-surface-muted bg-surface-soft sm:rounded-t-2xl"
            )}
          >
            <div className="min-w-0">
              <h2
                className={cn(
                  "font-inter text-lg font-bold",
                  tone === "danger" ? "text-error" : "text-ink"
                )}
              >
                {title}
              </h2>
              {description && (
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    tone === "danger" ? "text-error/80" : "text-ink-soft"
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn(
                "-mr-2 -mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                tone === "danger"
                  ? "text-error/70 hover:bg-error/10 hover:text-error"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink"
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>

        {footer && (
          <div
            className="flex flex-col-reverse gap-3 border-t border-surface-muted bg-surface px-6 py-4 sm:flex-row sm:justify-end sm:rounded-b-2xl"
            style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
