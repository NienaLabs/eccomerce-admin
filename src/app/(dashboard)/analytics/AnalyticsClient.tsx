"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  Store,
  Users,
  Package,
  ChartNoAxesCombined,
} from "lucide-react";
import type { PlatformOverview } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocaleNumber } from "@/components/ui/LocaleNumber";
import { formatGHS, formatCount } from "@/lib/utils";

/**
 * Single-series magnitude chart, so one hue for every bar.
 *
 * Colouring each vendor differently would encode rank as identity — the colours
 * would shift the moment the ranking did. This hue sits in the brand's lime
 * family but dark enough to clear 3:1 against the card surface, which #c3d809
 * itself does not.
 */
const BAR_HUE = "#7a8a05";

interface VendorDatum {
  name: string;
  revenue: number;
  orders: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: VendorDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;

  return (
    <div className="rounded-xl border border-surface-muted bg-surface px-3 py-2 shadow-[var(--shadow-raised-3)]">
      <p className="font-inter text-sm font-semibold text-ink">{datum.name}</p>
      <p className="mt-1 font-open-sans text-xs text-ink-soft">
        {formatGHS(datum.revenue)} revenue
      </p>
      <p className="font-open-sans text-xs text-ink-muted">
        {formatCount(datum.orders)} order{datum.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function AnalyticsClient({ overview }: { overview: PlatformOverview | null }) {
  if (!overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          icon={<ChartNoAxesCombined className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
          description="Platform-wide revenue, orders and vendor performance."
        />
        <EmptyState
          icon={<ChartNoAxesCombined className="h-10 w-10" />}
          title="Analytics unavailable"
          message="The backend didn't return platform metrics. Check that the API is reachable and that your account still holds the admin role."
        />
      </div>
    );
  }

  const vendors: VendorDatum[] = (overview.top_vendors ?? [])
    .map((v) => ({
      name: v.store_name?.trim() || "Unnamed store",
      revenue: Number(v.revenue ?? 0),
      orders: Number(v.order_count ?? 0),
    }))
    .filter((v) => v.revenue > 0 || v.orders > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...vendors.map((v) => v.revenue), 1);

  const stats = [
    {
      label: "Gross Revenue",
      value: <LocaleNumber value={overview.total_revenue} currency />,
      icon: <TrendingUp className="h-5 w-5" />,
      tone: "primary" as const,
      hint: "Confirmed through delivered",
    },
    {
      label: "Revenue Today",
      value: <LocaleNumber value={overview.revenue_today} currency />,
      icon: <TrendingUp className="h-5 w-5" />,
      tone: "success" as const,
    },
    {
      label: "Total Orders",
      value: <LocaleNumber value={overview.total_orders} />,
      icon: <ShoppingCart className="h-5 w-5" />,
      tone: "info" as const,
    },
    {
      label: "Orders Today",
      value: <LocaleNumber value={overview.orders_today} />,
      icon: <ShoppingCart className="h-5 w-5" />,
      tone: "neutral" as const,
    },
    {
      label: "Pending Orders",
      value: <LocaleNumber value={overview.pending_orders} />,
      icon: <Clock className="h-5 w-5" />,
      tone: "warning" as const,
      hint: "Awaiting vendor action",
    },
    {
      label: "Total Vendors",
      value: <LocaleNumber value={overview.total_vendors} />,
      icon: <Store className="h-5 w-5" />,
      tone: "neutral" as const,
    },
    {
      label: "Total Users",
      value: <LocaleNumber value={overview.total_users} />,
      icon: <Users className="h-5 w-5" />,
      tone: "neutral" as const,
    },
    {
      label: "Total Products",
      value: <LocaleNumber value={overview.total_products} />,
      icon: <Package className="h-5 w-5" />,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Analytics"
        icon={<ChartNoAxesCombined className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Platform-wide revenue, orders and vendor performance."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="rounded-xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-1)] sm:p-6">
        <h2 className="font-inter text-base font-bold text-ink sm:text-lg">
          Top vendors by revenue
        </h2>
        <p className="mt-1 font-open-sans text-sm text-ink-soft">
          Lifetime revenue across every order containing the vendor&apos;s items.
        </p>

        {vendors.length === 0 ? (
          <EmptyState
            icon={<Store className="h-10 w-10" />}
            title="No vendor revenue yet"
            message="Once orders start completing, the leading stores appear here."
            className="mt-4 border-0"
          />
        ) : (
          <>
            <div
              className="mt-5 w-full"
              // Bars keep a fixed height so five vendors don't render as five
              // fat slabs on desktop and five slivers on a phone.
              style={{ height: vendors.length * 56 + 24 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vendors}
                  layout="vertical"
                  margin={{ top: 0, right: 96, bottom: 0, left: 0 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--color-surface-muted)"
                    strokeDasharray="3 3"
                  />
                  <XAxis type="number" domain={[0, maxRevenue * 1.15]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={104}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "var(--color-ink-soft)",
                      fontSize: 12,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                    tickFormatter={(name: string) =>
                      name.length > 14 ? `${name.slice(0, 13)}…` : name
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "var(--color-surface-soft)" }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={BAR_HUE}
                    // Rounded at the data end, square on the baseline.
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="revenue"
                      position="right"
                      formatter={(value) => formatGHS(Number(value ?? 0))}
                      style={{
                        fill: "var(--color-ink)",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table view — carries order count, which must not share the
                chart's axis, and gives the chart an accessible equivalent. */}
            <div className="mt-6 overflow-hidden rounded-xl border border-surface-muted">
              <table className="min-w-full divide-y divide-surface-muted">
                <caption className="sr-only">
                  Top vendors by revenue, with order counts
                </caption>
                <thead className="bg-surface-soft">
                  <tr>
                    <th className="px-4 py-3 text-left font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Store
                    </th>
                    <th className="px-4 py-3 text-right font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-muted">
                  {vendors.map((vendor) => (
                    <tr key={vendor.name}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                            style={{ backgroundColor: BAR_HUE }}
                            aria-hidden="true"
                          />
                          <span className="truncate font-inter text-sm font-semibold text-ink">
                            {vendor.name}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-inter text-sm font-bold text-ink">
                        <LocaleNumber value={vendor.revenue} currency />
                      </td>
                      <td className="px-4 py-3 text-right font-open-sans text-sm text-ink-soft">
                        <LocaleNumber value={vendor.orders} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
