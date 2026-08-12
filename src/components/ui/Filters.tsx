"use client";

/**
 * The search-plus-selects bar that six screens each rebuilt by hand.
 *
 * Two fixes over the originals: the selects had `appearance-none` with no
 * chevron drawn, so they read as plain text boxes with no affordance; and the
 * whole bar was `items-center` in a flex row, which squeezed the search field
 * on narrow screens. Here it stacks cleanly and every control clears 44px.
 */

import { Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-surface-muted bg-surface p-3 sm:flex-row sm:items-center sm:p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-lg border border-surface-muted bg-surface-soft pl-9 pr-10 font-open-sans text-sm text-ink placeholder:text-ink-ghost focus:border-primary focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-44", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-11 w-full appearance-none rounded-lg border border-surface-muted bg-surface-soft pl-3 pr-9 font-open-sans text-sm text-ink focus:border-primary focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
    </div>
  );
}

/** Labelled field wrapper for forms inside sheets. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block font-inter text-sm font-semibold text-ink">{label}</label>
      {children}
      {error ? (
        <p className="font-open-sans text-xs text-error">{error}</p>
      ) : (
        hint && <p className="font-open-sans text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

/** Text input styled to the design.md §6 spec, for use inside `Field`. */
export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border-[1.5px] border-surface-muted bg-surface-soft px-4 font-open-sans text-sm text-ink placeholder:text-ink-ghost",
        "focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-ghost)] focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-xl border-[1.5px] border-surface-muted bg-surface-soft px-4 py-3 font-open-sans text-sm text-ink placeholder:text-ink-ghost",
        "focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-ghost)] focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
