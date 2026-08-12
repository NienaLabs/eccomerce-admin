"use client";

import { useState } from "react";
import {
  ReceiptText,
  Eye,
  Store,
  User,
  Truck,
  Package,
  RefreshCw,
  Inbox,
} from "lucide-react";
import {
  clientApi,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminOrderPage,
  type OrderStatus,
} from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, SearchInput, Select } from "@/components/ui/Filters";
import { DataView, DataCard, CardField, CardActions } from "@/components/ui/DataView";
import { LocaleNumber } from "@/components/ui/LocaleNumber";
import { useFeedback } from "@/components/ui/Feedback";
import { formatDateTime, shortId } from "@/lib/utils";

/**
 * Read-only order monitor.
 *
 * Fulfilment belongs to the vendor — this exists so that when a customer says
 * "my order is stuck", support can actually look at it instead of opening a
 * database client. Nothing here mutates an order.
 */

type Tone = "success" | "warning" | "error" | "info" | "primary" | "neutral";

const STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
  refunded: "neutral",
};

const ACCENT: Record<OrderStatus, "success" | "warning" | "error" | "info" | "primary"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
  refunded: "primary",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export function OrdersClient({ initialPage }: { initialPage: AdminOrderPage }) {
  const { toast } = useFeedback();

  const [page, setPage] = useState<AdminOrderPage>(initialPage);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const buildQuery = (skip: number) => {
    const params = new URLSearchParams({ skip: String(skip), limit: "50" });
    if (status !== "all") params.set("status_filter", status);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  };

  const load = async (skip = 0, append = false) => {
    setLoading(true);
    try {
      const res = await clientApi(`/admin/orders?${buildQuery(skip)}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const next: AdminOrderPage = await res.json();
      setPage((current) =>
        append ? { ...next, items: [...current.items, ...next.items] } : next
      );
    } catch {
      toast("Could not load orders. Check the backend connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (order: AdminOrder) => {
    setDetailLoading(true);
    // Show the row we already have so the sheet isn't blank while it loads.
    setDetail({ ...order, items: [], status_history: [] });
    try {
      const res = await clientApi(`/admin/orders/${order.id}`);
      if (!res.ok) throw new Error("Failed");
      setDetail(await res.json());
    } catch {
      toast("Could not load the full order.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const orders = page.items;
  const hasMore = orders.length < page.total;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Orders"
        icon={<ReceiptText className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Every order on the platform. Read-only — vendors own fulfilment."
        action={
          <Button
            variant="secondary"
            onClick={() => load(0)}
            disabled={loading}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by order or customer ID…"
        />
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} label="Status" />
        <Button onClick={() => load(0)} disabled={loading} className="sm:w-auto">
          Apply
        </Button>
      </FilterBar>

      <p className="font-open-sans text-sm text-ink-muted">
        Showing {orders.length} of <LocaleNumber value={page.total} /> orders
      </p>

      <DataView
        items={orders}
        keyOf={(order) => order.id}
        empty={
          <EmptyState
            icon={<Inbox className="h-10 w-10" />}
            title="No orders match"
            message="Try a different status, or clear the search to see everything."
          />
        }
        columns={[
          {
            header: "Order",
            cell: (order) => (
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-ink">
                  {shortId(order.id, 12)}
                </p>
                <p className="mt-0.5 font-open-sans text-xs text-ink-muted">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
            ),
          },
          {
            header: "Customer",
            hideBelow: "lg",
            cell: (order) => (
              <div className="min-w-0">
                <p className="truncate font-open-sans text-sm text-ink">
                  {order.user_name || order.user_email || "—"}
                </p>
                <p className="truncate font-mono text-xs text-ink-muted">
                  {shortId(order.user_id)}
                </p>
              </div>
            ),
          },
          {
            header: "Vendors",
            hideBelow: "xl",
            cell: (order) => (
              <p className="max-w-[200px] truncate font-open-sans text-sm text-ink-soft">
                {order.vendor_names.length > 0 ? order.vendor_names.join(", ") : "—"}
              </p>
            ),
          },
          {
            header: "Items",
            cell: (order) => (
              <span className="font-inter text-sm font-semibold text-ink-soft">
                {order.item_count}
              </span>
            ),
          },
          {
            header: "Total",
            cell: (order) => (
              <span className="font-inter text-sm font-bold text-ink">
                <LocaleNumber value={order.total_amount} currency />
              </span>
            ),
          },
          {
            header: "Status",
            cell: (order) => (
              <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>{order.status}</Badge>
            ),
          },
          {
            header: "Actions",
            align: "right",
            cell: (order) => (
              <IconButton
                label="View order"
                tone="info"
                onClick={() => openDetail(order)}
                icon={<Eye className="h-4 w-4" />}
              />
            ),
          },
        ]}
        card={(order) => (
          <DataCard accent={ACCENT[order.status] ?? "primary"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-ink">
                  {shortId(order.id, 14)}
                </p>
                <p className="mt-0.5 font-open-sans text-xs text-ink-muted">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
              <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>{order.status}</Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <CardField
                label="Total"
                value={
                  <span className="font-inter font-bold text-ink">
                    <LocaleNumber value={order.total_amount} currency />
                  </span>
                }
              />
              <CardField label="Items" value={order.item_count} />
              <CardField
                label="Customer"
                value={order.user_name || order.user_email || shortId(order.user_id)}
                className="col-span-2"
              />
              <CardField
                label="Vendors"
                value={order.vendor_names.length > 0 ? order.vendor_names.join(", ") : "—"}
                className="col-span-2"
              />
            </div>

            <CardActions>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDetail(order)}
                icon={<Eye className="h-4 w-4" />}
              >
                View details
              </Button>
            </CardActions>
          </DataCard>
        )}
      />

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => load(orders.length, true)}
            disabled={loading}
          >
            {loading ? "Loading…" : `Load more (${page.total - orders.length} left)`}
          </Button>
        </div>
      )}

      <Sheet
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Order ${shortId(detail.id, 12)}` : ""}
        description={detail ? formatDateTime(detail.created_at) : undefined}
        size="lg"
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[detail.status] ?? "neutral"}>{detail.status}</Badge>
              {detail.commission_aggregated && (
                <Badge tone="primary">Commission billed</Badge>
              )}
            </div>

            <section>
              <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Customer
              </h3>
              <div className="flex items-start gap-3 rounded-xl border border-surface-muted bg-surface-soft p-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-muted" />
                <div className="min-w-0">
                  <p className="font-open-sans text-sm text-ink">
                    {detail.user_name || "—"}
                  </p>
                  <p className="truncate font-open-sans text-xs text-ink-muted">
                    {detail.user_email || "No email on file"}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-ink-ghost">
                    {detail.user_id}
                  </p>
                </div>
              </div>
            </section>

            {(detail.agent_name || detail.agent_phone) && (
              <section>
                <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Delivery agent
                </h3>
                <div className="flex items-start gap-3 rounded-xl border border-surface-muted bg-surface-soft p-3">
                  <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-muted" />
                  <div className="min-w-0">
                    <p className="font-open-sans text-sm text-ink">
                      {detail.agent_name || "Unnamed"}
                    </p>
                    <p className="font-open-sans text-xs text-ink-muted">
                      {detail.agent_phone || "No phone"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Items {detailLoading && <span className="normal-case">· loading…</span>}
              </h3>
              {detail.items.length === 0 ? (
                <p className="font-open-sans text-sm text-ink-muted">
                  {detailLoading ? "Fetching line items…" : "No line items recorded."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-surface-muted p-3"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                        <Package className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-inter text-sm font-semibold text-ink">
                          {item.product_name || "Deleted product"}
                        </p>
                        <p className="flex items-center gap-1 truncate font-open-sans text-xs text-ink-muted">
                          <Store className="h-3 w-3" />
                          {item.vendor_name || shortId(item.vendor_id)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-inter text-sm font-bold text-ink">
                          <LocaleNumber
                            value={(item.discount_price ?? item.unit_price) * item.quantity}
                            currency
                          />
                        </p>
                        <p className="font-open-sans text-xs text-ink-muted">
                          ×{item.quantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-surface-muted bg-surface-soft p-4">
              <dl className="space-y-2 font-open-sans text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="font-inter font-semibold text-ink">
                    <LocaleNumber value={detail.subtotal} currency />
                  </dd>
                </div>
                {Boolean(detail.discount_amount) && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Discount</dt>
                    <dd className="font-inter font-semibold text-ink">
                      −<LocaleNumber value={detail.discount_amount ?? 0} currency />
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className="font-inter font-semibold text-ink">
                    <LocaleNumber value={detail.shipping_fee ?? 0} currency />
                  </dd>
                </div>
                <div className="flex justify-between border-t border-surface-deep pt-2">
                  <dt className="font-inter font-bold text-ink">Total</dt>
                  <dd className="font-inter text-base font-bold text-ink">
                    <LocaleNumber value={detail.total_amount} currency />
                  </dd>
                </div>
              </dl>
            </section>

            {detail.status_history.length > 0 && (
              <section>
                <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Status history
                </h3>
                <ol className="space-y-2">
                  {detail.status_history.map((entry, index) => (
                    <li key={`${entry.status}-${index}`} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="font-inter text-sm font-semibold capitalize text-ink">
                          {entry.status}
                        </p>
                        <p className="font-open-sans text-xs text-ink-muted">
                          {formatDateTime(entry.changed_at)}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {detail.notes && (
              <section>
                <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Customer notes
                </h3>
                <p className="rounded-xl border border-surface-muted bg-surface-soft p-3 font-open-sans text-sm text-ink-soft">
                  {detail.notes}
                </p>
              </section>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
