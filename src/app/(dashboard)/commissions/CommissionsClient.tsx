"use client";

import { useState } from "react";
import {
  Banknote,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Store,
  Package,
  XCircle,
  ReceiptText,
  RefreshCw,
  Percent,
  RotateCcw,
} from "lucide-react";
import { clientApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FilterBar,
  SearchInput,
  Select,
  Field,
  TextInput,
} from "@/components/ui/Filters";
import { LocaleNumber } from "@/components/ui/LocaleNumber";
import { useFeedback } from "@/components/ui/Feedback";
import { formatGHS, formatDate, shortId, cn } from "@/lib/utils";

interface CommissionEntry {
  id: string;
  vendor_id: string;
  order_id: string | null;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  entry_type: "charge" | "credit";
  period_date: string;
  status: "pending" | "billed" | "paid";
  billed_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  admin_note: string | null;
  created_at: string;
}

interface VendorSummary {
  vendor_id: string;
  store_name: string;
  store_slug: string;
  is_verified: boolean;
  total_gross: number;
  total_commission: number;
  pending_commission: number;
  billed_commission: number;
  paid_commission: number;
  delivered_orders: number;
  cancelled_orders: number;
  commission_rate: number;
  rate_is_custom: boolean;
  entries: CommissionEntry[];
}

// The old table used raw Tailwind palette colours (amber-100, blue-500,
// emerald-600) that exist nowhere in design.md. These map onto the system's
// feedback tokens instead.
const ENTRY_TONE = {
  pending: "warning",
  billed: "info",
  paid: "success",
} as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "billed", label: "Billed" },
  { value: "paid", label: "Paid" },
];

export function CommissionsClient({
  initialData,
  initialGlobalRate,
}: {
  initialData: VendorSummary[];
  initialGlobalRate: number;
}) {
  const { toast, confirm } = useFeedback();

  const [data, setData] = useState<VendorSummary[]>(initialData);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [payModal, setPayModal] = useState<{
    vendorId: string;
    storeName: string;
    entryIds: string[];
    total: number;
  } | null>(null);
  const [payMethod, setPayMethod] = useState("bank");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");

  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [globalRateInput, setGlobalRateInput] = useState(String(initialGlobalRate));
  const [globalRate, setGlobalRate] = useState(initialGlobalRate);

  const refresh = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status_filter", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await clientApi(`/admin/commissions?${params}`);
      if (res.ok) setData(await res.json());
      else toast("Could not refresh commissions.", "error");
    } catch {
      toast("Network error while refreshing.", "error");
    } finally {
      setLoading(false);
    }
  };

  const runAggregation = async () => {
    const ok = await confirm({
      title: "Run daily aggregation?",
      message:
        "Groups every newly delivered order into one commission entry per vendor. Safe to run more than once — orders already aggregated are skipped.",
      confirmLabel: "Run aggregation",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/commissions/aggregate`, { method: "POST" });
      if (res.ok) {
        const body = await res.json();
        toast(body.message || "Aggregation complete.", "success");
        await refresh();
      } else {
        toast("Aggregation failed.", "error");
      }
    } catch {
      toast("Network error during aggregation.", "error");
    } finally {
      setLoading(false);
    }
  };

  const billAll = async (vendor: VendorSummary) => {
    const pending = vendor.entries.filter((e) => e.status === "pending");
    if (pending.length === 0) return;
    const total = pending.reduce((sum, e) => sum + e.commission_amount, 0);

    const ok = await confirm({
      title: "Send commission invoice?",
      message: `${formatGHS(total)} across ${pending.length} entr${pending.length === 1 ? "y" : "ies"} will be invoiced to ${vendor.store_name}.`,
      confirmLabel: "Send invoice",
    });
    if (!ok) return;

    setActionLoading(vendor.vendor_id);
    try {
      const res = await clientApi(`/admin/commissions/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.vendor_id,
          entry_ids: pending.map((e) => e.id),
          payment_due_days: 3,
        }),
      });
      if (res.ok) {
        toast(`Invoiced ${vendor.store_name}.`, "success");
        await refresh();
      } else {
        toast("Could not bill that vendor.", "error");
      }
    } catch {
      toast("Network error while billing.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openPayModal = (vendor: VendorSummary) => {
    const billable = vendor.entries.filter(
      (e) => e.status === "billed" || e.status === "pending"
    );
    setPayModal({
      vendorId: vendor.vendor_id,
      storeName: vendor.store_name,
      entryIds: billable.map((e) => e.id),
      total: billable.reduce((sum, e) => sum + e.commission_amount, 0),
    });
    setPayMethod("bank");
    setPayRef("");
    setPayNote("");
  };

  const markPaid = async () => {
    if (!payModal) return;
    setActionLoading(payModal.vendorId);
    try {
      const res = await clientApi(`/admin/commissions/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_ids: payModal.entryIds,
          payment_method: payMethod,
          payment_reference: payRef.trim() || null,
          admin_note: payNote.trim() || null,
        }),
      });
      if (res.ok) {
        toast(`Recorded payment from ${payModal.storeName}.`, "success");
        setPayModal(null);
        await refresh();
      } else {
        toast("Could not record that payment.", "error");
      }
    } catch {
      toast("Network error while recording payment.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const setCustomRate = async (vendorId: string) => {
    const raw = rateInputs[vendorId];
    if (!raw) return;
    const rate = parseFloat(raw);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast("Enter a rate between 0 and 100.", "warning");
      return;
    }

    setActionLoading(`${vendorId}-rate`);
    try {
      const res = await clientApi(`/admin/commissions/vendors/${vendorId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate, reason: "Set from the admin commissions page" }),
      });
      if (res.ok) {
        setRateInputs((current) => {
          const next = { ...current };
          delete next[vendorId];
          return next;
        });
        toast(`Custom rate set to ${rate}%.`, "success");
        await refresh();
      } else {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Could not set that rate.",
          "error"
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const clearCustomRate = async (vendorId: string, storeName: string) => {
    const ok = await confirm({
      title: "Reset to the platform rate?",
      message: `${storeName} goes back to the standard ${globalRate}%. Commissions already recorded keep the rate they were charged at.`,
      confirmLabel: "Reset rate",
    });
    if (!ok) return;

    setActionLoading(`${vendorId}-rate`);
    try {
      const res = await clientApi(`/admin/commissions/vendors/${vendorId}/rate`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast(`${storeName} is on the platform rate.`, "success");
        await refresh();
      } else {
        toast("Could not reset that rate.", "error");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const saveGlobalRate = async () => {
    const rate = parseFloat(globalRateInput);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast("Enter a rate between 0 and 100.", "warning");
      return;
    }

    const ok = await confirm({
      title: `Charge ${rate}% on every sale?`,
      message:
        "This applies immediately across the vendor app and this page. Vendors with a custom rate are unaffected, and sales already recorded keep the rate they were charged at.",
      confirmLabel: "Save rate",
    });
    if (!ok) return;

    setActionLoading("global-rate");
    try {
      const res = await clientApi(`/admin/settings/platform_commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: String(rate) }),
      });
      if (res.ok) {
        setGlobalRate(rate);
        toast(`Now charging ${rate}% on every sale.`, "success");
        // Vendors without an override are on the new rate — repull so the list
        // stops showing the old one.
        await refresh();
      } else {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string"
            ? detail.detail
            : "Could not update the platform commission.",
          "error"
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = data.filter(
    (v) => !search || v.store_name.toLowerCase().includes(search.toLowerCase())
  );

  const totals = data.reduce(
    (acc, v) => ({
      gmv: acc.gmv + v.total_gross,
      pending: acc.pending + v.pending_commission,
      billed: acc.billed + v.billed_commission,
      paid: acc.paid + v.paid_commission,
    }),
    { gmv: 0, pending: 0, billed: 0, paid: 0 }
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Commissions"
        icon={<Banknote className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Vendor sales, commission rates and billing."
        action={
          <>
            <Button
              variant="dark"
              onClick={runAggregation}
              disabled={loading}
              icon={<Banknote className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Run aggregation</span>
              <span className="sm:hidden">Aggregate</span>
            </Button>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh"
              icon={<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />}
            />
          </>
        }
      />

      {/* ── Platform rate ── */}
      <section className="rounded-xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-1)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-ghost text-ink">
              <Percent className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-inter text-base font-bold text-ink sm:text-lg">
                Platform commission rate
              </h2>
              <p className="mt-1 max-w-xl font-open-sans text-sm text-ink-soft">
                Charged on every sale by every vendor without a custom rate.
                Currently <strong className="font-semibold text-ink">{globalRate}%</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={globalRateInput}
                onChange={(e) => setGlobalRateInput(e.target.value)}
                aria-label="Platform commission rate"
                inputMode="decimal"
                className="h-11 w-28 rounded-lg border border-surface-muted bg-surface px-3 pr-7 text-right font-mono text-base text-ink focus:border-primary focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                %
              </span>
            </div>
            <Button
              onClick={saveGlobalRate}
              disabled={
                parseFloat(globalRateInput) === globalRate || actionLoading === "global-rate"
              }
            >
              {actionLoading === "global-rate" ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Totals ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Platform GMV"
          tone="primary"
          icon={<TrendingUp className="h-5 w-5" />}
          value={<LocaleNumber value={totals.gmv} currency />}
        />
        <StatCard
          label="Pending"
          tone="warning"
          icon={<Clock className="h-5 w-5" />}
          value={<LocaleNumber value={totals.pending} currency />}
        />
        <StatCard
          label="Billed"
          tone="info"
          icon={<AlertCircle className="h-5 w-5" />}
          value={<LocaleNumber value={totals.billed} currency />}
        />
        <StatCard
          label="Collected"
          tone="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
          value={<LocaleNumber value={totals.paid} currency />}
        />
      </div>

      {/* ── Filters ── */}
      <FilterBar className="flex-col sm:flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search vendor…" />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          label="Entry status"
        />
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
            className="h-11 w-full rounded-lg border border-surface-muted bg-surface-soft px-3 font-open-sans text-sm text-ink focus:border-primary focus:outline-none sm:w-auto"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
            className="h-11 w-full rounded-lg border border-surface-muted bg-surface-soft px-3 font-open-sans text-sm text-ink focus:border-primary focus:outline-none sm:w-auto"
          />
        </div>
        <Button onClick={refresh} disabled={loading} className="sm:w-auto">
          Apply
        </Button>
      </FilterBar>

      {/* ── Vendors ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-10 w-10" />}
          title="No commission data"
          message="Entries are created automatically when orders are delivered. Run the daily aggregation if deliveries have happened since the last run."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((vendor) => {
            const isExpanded = expanded === vendor.vendor_id;
            const hasPending = vendor.entries.some((e) => e.status === "pending");
            const hasBilled = vendor.entries.some((e) => e.status === "billed");
            const busy = actionLoading === vendor.vendor_id;

            return (
              <div
                key={vendor.vendor_id}
                className="overflow-hidden rounded-xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)]"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary-border bg-primary-ghost text-ink">
                      <Store className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-inter text-sm font-semibold text-ink">
                          {vendor.store_name}
                        </p>
                        {vendor.is_verified && <Badge tone="success">Verified</Badge>}
                        <Badge tone={vendor.rate_is_custom ? "primary" : "neutral"}>
                          {vendor.commission_rate}%{vendor.rate_is_custom ? " custom" : ""}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate font-open-sans text-xs text-ink-muted">
                        @{vendor.store_slug}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : vendor.vendor_id)}
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? `Hide ledger for ${vendor.store_name}`
                          : `Show ledger for ${vendor.store_name}`
                      }
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* A five-column stat strip crammed into a flex row is
                      unreadable on a phone; it wraps to a grid instead. */}
                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {[
                      { label: "GMV", value: vendor.total_gross, currency: true },
                      { label: "Pending", value: vendor.pending_commission, currency: true },
                      { label: "Billed", value: vendor.billed_commission, currency: true },
                      {
                        label: "Delivered",
                        value: vendor.delivered_orders,
                        icon: <Package className="h-3.5 w-3.5" />,
                      },
                      {
                        label: "Cancelled",
                        value: vendor.cancelled_orders,
                        icon: <XCircle className="h-3.5 w-3.5" />,
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="min-w-0">
                        <dt className="font-inter text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                          {stat.label}
                        </dt>
                        <dd className="mt-0.5 flex items-center gap-1 truncate font-inter text-sm font-bold text-ink">
                          {stat.icon}
                          <LocaleNumber value={stat.value} currency={stat.currency} />
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {(hasPending || hasBilled) && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-muted pt-3">
                      {hasPending && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => billAll(vendor)}
                          disabled={busy}
                          className="border-warning text-warning"
                        >
                          Bill now
                        </Button>
                      )}
                      <Button size="sm" onClick={() => openPayModal(vendor)} disabled={busy}>
                        Mark paid
                      </Button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-muted bg-surface-soft/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="flex items-center gap-2 font-inter text-sm font-bold text-ink">
                        <ReceiptText className="h-4 w-4 text-ink-muted" />
                        Ledger ({vendor.entries.length})
                      </h3>

                      <div className="flex items-center gap-2 rounded-lg border border-surface-muted bg-surface p-2">
                        <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                          Rate
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          inputMode="decimal"
                          placeholder={String(vendor.commission_rate)}
                          value={rateInputs[vendor.vendor_id] ?? ""}
                          onChange={(e) =>
                            setRateInputs({
                              ...rateInputs,
                              [vendor.vendor_id]: e.target.value,
                            })
                          }
                          aria-label={`Custom rate for ${vendor.store_name}`}
                          className="h-9 w-16 rounded border border-surface-muted bg-surface px-2 text-right font-mono text-xs text-ink focus:border-primary focus:outline-none"
                        />
                        <span className="font-inter text-xs font-bold text-ink-muted">%</span>
                        <Button
                          size="sm"
                          variant="dark"
                          onClick={() => setCustomRate(vendor.vendor_id)}
                          disabled={
                            !rateInputs[vendor.vendor_id] ||
                            actionLoading === `${vendor.vendor_id}-rate`
                          }
                          className="!min-h-9 px-3"
                        >
                          Save
                        </Button>
                        {vendor.rate_is_custom && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              clearCustomRate(vendor.vendor_id, vendor.store_name)
                            }
                            disabled={actionLoading === `${vendor.vendor_id}-rate`}
                            aria-label="Reset to platform rate"
                            className="!min-h-9 px-2"
                            icon={<RotateCcw className="h-3 w-3" />}
                          />
                        )}
                      </div>
                    </div>

                    {vendor.entries.length === 0 ? (
                      <p className="py-6 text-center font-open-sans text-sm text-ink-muted">
                        No ledger entries in this period.
                      </p>
                    ) : (
                      <>
                        {/* Desktop ledger */}
                        <div className="mt-3 hidden overflow-x-auto rounded-lg border border-surface-muted bg-surface md:block">
                          <table className="min-w-full text-sm">
                            <thead className="bg-surface-soft">
                              <tr className="font-inter text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-left">Order</th>
                                <th className="px-3 py-2 text-left">Type</th>
                                <th className="px-3 py-2 text-right">Gross</th>
                                <th className="px-3 py-2 text-right">Rate</th>
                                <th className="px-3 py-2 text-right">Commission</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Ref</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-muted">
                              {vendor.entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-surface-soft/50">
                                  <td className="whitespace-nowrap px-3 py-2.5 font-open-sans text-xs text-ink-soft">
                                    {formatDate(entry.period_date)}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">
                                    {entry.order_id ? shortId(entry.order_id) : "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <Badge
                                      tone={
                                        entry.entry_type === "credit" ? "primary" : "neutral"
                                      }
                                    >
                                      {entry.entry_type === "credit" ? "Refund" : "Charge"}
                                    </Badge>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-inter font-bold text-ink">
                                    {entry.entry_type === "credit" ? "−" : ""}
                                    <LocaleNumber value={entry.gross_amount} currency />
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-open-sans text-ink-soft">
                                    {entry.commission_rate}%
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-inter font-bold text-ink">
                                    {entry.entry_type === "credit" ? "−" : ""}
                                    <LocaleNumber value={entry.commission_amount} currency />
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <Badge tone={ENTRY_TONE[entry.status] ?? "neutral"}>
                                      {entry.status}
                                    </Badge>
                                  </td>
                                  <td className="max-w-[160px] truncate px-3 py-2.5 font-open-sans text-xs text-ink-muted">
                                    {entry.payment_reference || entry.admin_note || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t-2 border-surface-muted bg-surface-soft">
                              <tr className="font-inter text-sm font-bold text-ink">
                                <td colSpan={3} className="px-3 py-2.5 text-[10px] uppercase">
                                  Totals
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <LocaleNumber value={vendor.total_gross} currency />
                                </td>
                                <td />
                                <td className="px-3 py-2.5 text-right">
                                  <LocaleNumber value={vendor.total_commission} currency />
                                </td>
                                <td colSpan={2} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Mobile ledger */}
                        <ul className="mt-3 space-y-2 md:hidden">
                          {vendor.entries.map((entry) => (
                            <li
                              key={entry.id}
                              className="rounded-lg border border-surface-muted bg-surface p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-inter text-sm font-bold text-ink">
                                    {entry.entry_type === "credit" ? "−" : ""}
                                    <LocaleNumber value={entry.commission_amount} currency />
                                  </p>
                                  <p className="font-open-sans text-xs text-ink-muted">
                                    {formatDate(entry.period_date)} · {entry.commission_rate}%
                                    of{" "}
                                    <LocaleNumber value={entry.gross_amount} currency />
                                  </p>
                                </div>
                                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                  <Badge tone={ENTRY_TONE[entry.status] ?? "neutral"}>
                                    {entry.status}
                                  </Badge>
                                  {entry.entry_type === "credit" && (
                                    <Badge tone="primary">Refund</Badge>
                                  )}
                                </div>
                              </div>
                              {(entry.payment_reference || entry.admin_note) && (
                                <p className="mt-2 truncate border-t border-surface-muted pt-2 font-open-sans text-xs text-ink-muted">
                                  {entry.payment_reference || entry.admin_note}
                                </p>
                              )}
                            </li>
                          ))}
                          <li className="rounded-lg border border-surface-deep bg-surface-soft p-3">
                            <div className="flex justify-between font-inter text-sm font-bold text-ink">
                              <span>Total commission</span>
                              <LocaleNumber value={vendor.total_commission} currency />
                            </div>
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Record payment ── */}
      <Sheet
        open={payModal !== null}
        onClose={() => setPayModal(null)}
        title="Record payment"
        description={
          payModal
            ? `${formatGHS(payModal.total)} across ${payModal.entryIds.length} entr${payModal.entryIds.length === 1 ? "y" : "ies"} from ${payModal.storeName}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPayModal(null)}
              className="sm:w-auto"
              block
            >
              Cancel
            </Button>
            <Button
              onClick={markPaid}
              disabled={actionLoading !== null}
              className="sm:w-auto"
              block
            >
              {actionLoading ? "Saving…" : "Confirm payment"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Payment method">
            <Select
              value={payMethod}
              onChange={setPayMethod}
              label="Payment method"
              className="w-full sm:w-full"
              options={[
                { value: "bank", label: "Bank transfer" },
                { value: "mobile_money", label: "Mobile money" },
              ]}
            />
          </Field>

          <Field label="Payment reference" hint="Optional — the transaction ID.">
            <TextInput
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. GH-TXN-12345"
            />
          </Field>

          <Field label="Admin note" hint="Optional — visible on the ledger entry.">
            <TextInput
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Anything worth recording…"
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
