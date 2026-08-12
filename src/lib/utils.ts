import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Every formatter below is deterministic on purpose.
 *
 * `toLocaleString` resolves against the host's ICU data and time zone, so the
 * Node render and the browser render disagree — which React reports as a
 * hydration failure and then throws away the server HTML for. The previous
 * code worked around it with `mounted` flags that rendered "—" on first paint.
 * Formatting by hand instead means server and client produce identical strings,
 * so no guard is needed anywhere.
 *
 * Dates use UTC. The platform settles in Ghana cedis and Ghana is UTC+0, so
 * this is also the right wall-clock for the team reading it.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** 1234567.5 → "1,234,567.50" */
function group(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, fraction] = fixed.split(".");
  const withSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${withSeparators}.${fraction}` : withSeparators;
}

/** Ghana cedi, the platform's settlement currency. */
export function formatGHS(value: number): string {
  if (!Number.isFinite(value)) return "GH₵ 0.00";
  return `GH₵ ${group(value, 2)}`;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return group(value, 0);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Short, unambiguous date for dense list rows — "11 Aug 2026". */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "11 Aug 2026, 18:56" — 24-hour, so there is no AM/PM ambiguity in a log. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(value)}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** Truncated id for display — full ids blow out every mobile row. */
export function shortId(id: string, length = 8): string {
  return id.length > length ? `${id.slice(0, length)}…` : id;
}
