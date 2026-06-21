import { cookies } from "next/headers";
import { Users, Store, ShoppingCart, TrendingUp, Package, Star } from "lucide-react";
import { fetchJson, fetchList, type AdminProduct, type AdminUser, type Vendor, type DatabaseHealth } from "@/lib/api";

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value || "";

  const [users, vendors, products, health] = await Promise.all([
    fetchList<AdminUser>("/admin/users", token),
    fetchList<Vendor>("/admin/vendors", token),
    fetchList<AdminProduct>("/admin/products", token),
    fetchJson<DatabaseHealth | null>("/admin/health", token, null),
  ]);

  const pendingVendors = vendors.filter((v) => !v.is_verified).length;

  const stats = [
    {
      name: "Total Users",
      value: health?.total_users ?? users.length,
      icon: Users,
      color: "text-info",
      bg: "bg-info-ghost",
    },
    {
      name: "Total Vendors",
      value: health?.total_vendors ?? vendors.length,
      icon: Store,
      color: "text-success",
      bg: "bg-success-ghost",
    },
    {
      name: "Pending Applications",
      value: pendingVendors,
      icon: Star,
      color: "text-warning",
      bg: "bg-warning-ghost",
    },
    {
      name: "Total Products",
      value: health?.total_products ?? products.length,
      icon: Package,
      color: "text-ink-muted",
      bg: "bg-surface-muted",
    },
    {
      name: "Total Orders",
      value: "—",
      icon: ShoppingCart,
      color: "text-error",
      bg: "bg-error-ghost",
    },
    {
      name: "Gross Revenue",
      value: "—",
      icon: TrendingUp,
      color: "text-ink",
      bg: "bg-primary-ghost",
    },
  ];

  // Pull last 5 products as recent activity
  const recentProducts = products.slice(-5).reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
          Platform Overview
        </h1>
        <p className="text-ink-soft mt-1 text-sm">
          Live metrics fetched directly from your backend.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="overflow-hidden rounded-xl bg-surface border border-surface-muted p-5 shadow-sm flex flex-col gap-3"
            >
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">{stat.name}</p>
                <p className="mt-1 text-3xl font-bold font-inter text-ink">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Products */}
      <div className="rounded-xl bg-surface border border-surface-muted shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-muted bg-surface-soft">
          <h2 className="text-base font-bold font-inter text-ink">Recently Added Products</h2>
        </div>
        <div className="divide-y divide-surface-muted">
          {recentProducts.length > 0 ? (
            recentProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-soft/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-surface-muted border border-surface-deep flex items-center justify-center text-ink-ghost">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink font-inter truncate">{p.name || "Unnamed Product"}</p>
                    <p className="text-xs text-ink-soft font-mono truncate">Vendor: {p.vendor_id}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <span className="text-sm font-bold text-ink font-inter">
                    ${Number(p.actual_price ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-ink-muted text-sm">
              No products found or could not reach backend.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
