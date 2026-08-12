import { cookies } from "next/headers";
import Link from "next/link";
import {
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  Package,
  ClipboardCheck,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  fetchJson,
  fetchList,
  type AdminProduct,
  type AdminUser,
  type Vendor,
  type PlatformOverview,
} from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocaleNumber } from "@/components/ui/LocaleNumber";

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value || "";

  // `/analytics/admin/overview` already computed every headline figure — order
  // counts and revenue included — but this page never called it and printed a
  // literal "—" for both instead.
  const [overview, users, vendors, products] = await Promise.all([
    fetchJson<PlatformOverview | null>("/analytics/admin/overview", token, null),
    fetchList<AdminUser>("/admin/users", token),
    fetchList<Vendor>("/admin/vendors", token),
    fetchList<AdminProduct>("/admin/products", token),
  ]);

  const pendingVendors = vendors.filter((v) => !v.is_verified).length;

  const stats = [
    {
      name: "Total Users",
      value: overview?.total_users ?? users.length,
      icon: Users,
      tone: "info" as const,
    },
    {
      name: "Total Vendors",
      value: overview?.total_vendors ?? vendors.length,
      icon: Store,
      tone: "success" as const,
    },
    {
      name: "Pending Applications",
      value: pendingVendors,
      icon: ClipboardCheck,
      tone: "warning" as const,
    },
    {
      name: "Total Products",
      value: overview?.total_products ?? products.length,
      icon: Package,
      tone: "neutral" as const,
    },
    {
      name: "Total Orders",
      value: overview?.total_orders ?? 0,
      icon: ShoppingCart,
      tone: "error" as const,
    },
    {
      name: "Gross Revenue",
      value: overview?.total_revenue ?? 0,
      icon: TrendingUp,
      tone: "primary" as const,
      currency: true,
    },
  ];

  const recentProducts = products.slice(-5).reverse();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Platform Overview"
        description="Live metrics pulled straight from the backend."
      />

      {overview && (overview.orders_today > 0 || overview.pending_orders > 0) && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-border bg-primary-ghost p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" />
            <p className="font-open-sans text-sm text-ink">
              <strong className="font-semibold">
                <LocaleNumber value={overview.orders_today} />
              </strong>{" "}
              order{overview.orders_today === 1 ? "" : "s"} today ·{" "}
              <strong className="font-semibold">
                <LocaleNumber value={overview.pending_orders} />
              </strong>{" "}
              awaiting action
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex min-h-11 items-center gap-1.5 font-inter text-sm font-semibold text-ink hover:underline"
          >
            View orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.name}
              label={stat.name}
              tone={stat.tone}
              icon={<Icon className="h-5 w-5" aria-hidden="true" />}
              value={
                <LocaleNumber value={stat.value} currency={stat.currency} />
              }
            />
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)]">
        <div className="flex items-center justify-between border-b border-surface-muted bg-surface-soft px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-inter text-base font-bold text-ink">
            Recently added products
          </h2>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center gap-1 font-inter text-sm font-semibold text-ink-soft hover:text-ink"
          >
            All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentProducts.length > 0 ? (
          <div className="divide-y divide-surface-muted">
            {recentProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-soft/50 sm:px-6 sm:py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-surface-deep bg-surface-muted text-ink-ghost">
                    <Package className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-inter text-sm font-semibold text-ink">
                      {p.name || "Unnamed product"}
                    </p>
                    <p className="truncate font-mono text-xs text-ink-muted">
                      {p.vendor_id}
                    </p>
                  </div>
                </div>
                <span className="flex-shrink-0 font-inter text-sm font-bold text-ink">
                  <LocaleNumber value={Number(p.actual_price ?? 0)} currency />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="No products yet"
            message="Either no vendor has listed anything, or the backend is unreachable."
            className="border-0"
          />
        )}
      </section>
    </div>
  );
}
