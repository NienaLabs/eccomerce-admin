"use client";

/**
 * The fix for this dashboard's core mobile problem.
 *
 * Every list screen was a `<table>` inside `overflow-x-auto`, which on a phone
 * is a sideways-scrolling spreadsheet — you cannot see a row and its actions at
 * the same time. `DataView` renders the table on `md+` where the width exists,
 * and a stack of cards below it.
 *
 * The card is an explicit render prop rather than something derived from the
 * columns: a good card re-ranks the same data (identity first, actions last,
 * secondary detail demoted) instead of stacking cells in column order.
 */

import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (item: T) => React.ReactNode;
  align?: "left" | "right";
  /** Hide this column on narrower desktop widths where it's least load-bearing. */
  hideBelow?: "lg" | "xl";
}

interface DataViewProps<T> {
  items: T[];
  columns: Column<T>[];
  card: (item: T) => React.ReactNode;
  keyOf: (item: T) => string;
  empty?: React.ReactNode;
  rowClassName?: (item: T) => string;
}

export function DataView<T>({
  items,
  columns,
  card,
  keyOf,
  empty,
  rowClassName,
}: DataViewProps<T>) {
  if (items.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <>
      {/* ── Desktop: table ── */}
      <div className="hidden overflow-hidden rounded-xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-muted">
            <thead className="bg-surface-soft">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.header}
                    scope="col"
                    className={cn(
                      "px-6 py-4 font-inter text-xs font-bold uppercase tracking-wider text-ink-muted",
                      col.align === "right" ? "text-right" : "text-left",
                      col.hideBelow === "lg" && "hidden lg:table-cell",
                      col.hideBelow === "xl" && "hidden xl:table-cell"
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-muted bg-surface">
              {items.map((item) => (
                <tr
                  key={keyOf(item)}
                  className={cn(
                    "transition-colors hover:bg-surface-soft/50",
                    rowClassName?.(item)
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={cn(
                        "px-6 py-4 align-middle",
                        col.align === "right" ? "text-right" : "text-left",
                        col.hideBelow === "lg" && "hidden lg:table-cell",
                        col.hideBelow === "xl" && "hidden xl:table-cell"
                      )}
                    >
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div key={keyOf(item)} className={cn(rowClassName?.(item))}>
            {card(item)}
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Consistent chrome for a mobile card. `accent` draws the design.md §6 left
 * status bar used by order and history cards.
 */
export function DataCard({
  children,
  accent,
  className,
}: {
  children: React.ReactNode;
  accent?: "success" | "warning" | "error" | "info" | "primary";
  className?: string;
}) {
  const accents = {
    success: "before:bg-success",
    warning: "before:bg-warning",
    error: "before:bg-error",
    info: "before:bg-info",
    primary: "before:bg-primary",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-2)]",
        accent &&
          cn(
            "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full pl-5",
            accents[accent]
          ),
        className
      )}
    >
      {children}
    </div>
  );
}

/** Label/value pair for the body of a mobile card. */
export function CardField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <div className="mt-0.5 truncate font-open-sans text-sm text-ink-soft">{value}</div>
    </div>
  );
}

/** Bottom action row of a mobile card, divided from the content above it. */
export function CardActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-surface-muted pt-2">
      {children}
    </div>
  );
}
