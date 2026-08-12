import { formatCount, formatGHS } from "@/lib/utils";

/**
 * Renders a number in the platform's format.
 *
 * This used to defer formatting until after mount, because `toLocaleString`
 * disagrees between the Node render and the browser. `formatGHS`/`formatCount`
 * are deterministic now (see `lib/utils`), so there is nothing to guard against
 * and no second render pass — it's a plain server component.
 */
export function LocaleNumber({
  value,
  currency = false,
}: {
  value: number | string;
  currency?: boolean;
}) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return <>{value}</>;

  return <>{currency ? formatGHS(numeric) : formatCount(numeric)}</>;
}
