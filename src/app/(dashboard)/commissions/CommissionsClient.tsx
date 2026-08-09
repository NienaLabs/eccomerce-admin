"use client";

import { useState, useEffect } from "react";
import {
  Banknote, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Store, Package, XCircle,
  ReceiptText, Filter, Search, RefreshCw, Percent, RotateCcw
} from "lucide-react";
import { clientApi } from "@/lib/api";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  billed: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const GHS = (n: number) =>
  `GH₵ ${Math.abs(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CommissionsClient({ initialData, initialGlobalRate }: { initialData: VendorSummary[]; initialGlobalRate: number }) {
  const [data, setData] = useState<VendorSummary[]>(initialData);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mark paid modal state
  const [payModal, setPayModal] = useState<{ vendorId: string; entryIds: string[]; total: number } | null>(null);
  const [payMethod, setPayMethod] = useState("bank");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status_filter", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await clientApi(`/admin/commissions?${params}`, {
              });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleRunAggregation = async () => {
    if (!confirm("Run daily aggregation to group all new delivered orders into single commission entries per vendor?")) return;
    setLoading(true);
    try {
      const res = await clientApi(`/admin/commissions/aggregate`, {
        method: "POST",
              });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Aggregation completed successfully.");
        await refresh();
      } else {
        alert("Failed to run aggregation.");
      }
    } catch (e) {
      alert("Error running aggregation.");
    } finally {
      setLoading(false);
    }
  };

  const handleBillAll = async (vendor: VendorSummary) => {
    const pendingEntries = vendor.entries.filter(e => e.status === "pending");
    if (!pendingEntries.length) return;
    const total = pendingEntries.reduce((s, e) => s + e.commission_amount, 0);
    if (!confirm(`Send a commission invoice of ${GHS(total)} to ${vendor.store_name}?`)) return;

    setActionLoading(vendor.vendor_id);
    try {
      const res = await clientApi(`/admin/commissions/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.vendor_id,
          entry_ids: pendingEntries.map(e => e.id),
          payment_due_days: 3,
        }),
      });
      if (res.ok) await refresh();
      else alert("Failed to bill vendor");
    } finally {
      setActionLoading(null);
    }
  };

  const openPayModal = (vendor: VendorSummary) => {
    const billableEntries = vendor.entries.filter(e => e.status === "billed" || e.status === "pending");
    const total = billableEntries.reduce((s, e) => s + e.commission_amount, 0);
    setPayModal({ vendorId: vendor.vendor_id, entryIds: billableEntries.map(e => e.id), total });
    setPayMethod("bank"); setPayRef(""); setPayNote("");
  };

  const handleMarkPaid = async () => {
    if (!payModal) return;
    setActionLoading(payModal.vendorId);
    try {
      const res = await clientApi(`/admin/commissions/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_ids: payModal.entryIds,
          payment_method: payMethod,
          payment_reference: payRef || null,
          admin_note: payNote || null,
        }),
      });
      if (res.ok) { await refresh(); setPayModal(null); }
      else alert("Failed to mark as paid");
    } finally {
      setActionLoading(null);
    }
  };

  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});

  const handleSetCustomRate = async (vendorId: string) => {
    const rateStr = rateInputs[vendorId];
    if (!rateStr) return;
    const rate = parseFloat(rateStr);
    if (isNaN(rate) || rate < 0 || rate > 100) return alert("Enter a rate between 0 and 100.");

    setActionLoading(vendorId + "-rate");
    try {
      const res = await clientApi(`/admin/commissions/vendors/${vendorId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate, reason: "Set from the admin commissions page" }),
      });
      if (res.ok) {
        await refresh();
        setRateInputs(prev => { const n = { ...prev }; delete n[vendorId]; return n; });
      } else {
        const detail = await res.json().catch(() => null);
        alert(detail?.detail ?? "Failed to update rate");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCustomRate = async (vendorId: string, storeName: string) => {
    if (!confirm(`Put ${storeName} back on the standard ${globalRate}% rate?`)) return;
    setActionLoading(vendorId + "-rate");
    try {
      const res = await clientApi(`/admin/commissions/vendors/${vendorId}/rate`, {
        method: "DELETE",
              });
      if (res.ok) await refresh();
      else alert("Failed to reset rate");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Global rate ────────────────────────────────────────────────────────────
  const [globalRateInput, setGlobalRateInput] = useState(String(initialGlobalRate));
  const [globalRate, setGlobalRate] = useState(initialGlobalRate);
  const [globalSaved, setGlobalSaved] = useState(false);

  const handleSaveGlobalRate = async () => {
    const rate = parseFloat(globalRateInput);
    if (isNaN(rate) || rate < 0 || rate > 100) return alert("Enter a rate between 0 and 100.");

    setActionLoading("global-rate");
    try {
      const res = await clientApi(`/admin/settings/platform_commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: String(rate) }),
      });
      if (res.ok) {
        setGlobalRate(rate);
        setGlobalSaved(true);
        setTimeout(() => setGlobalSaved(false), 2500);
        // Vendors without an override are now on the new rate — repull so the
        // table stops showing the old one.
        await refresh();
      } else {
        const detail = await res.json().catch(() => null);
        alert(detail?.detail ?? "Failed to update the platform commission");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = data.filter(v =>
    (search === "" || v.store_name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPending = data.reduce((s, v) => s + v.pending_commission, 0);
  const totalBilled = data.reduce((s, v) => s + v.billed_commission, 0);
  const totalPaid = data.reduce((s, v) => s + v.paid_commission, 0);
  const totalGMV = data.reduce((s, v) => s + v.total_gross, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
            <Banknote className="w-8 h-8 mr-3 text-primary" />
            Commission Tracker
          </h1>
          <p className="text-ink-soft mt-1">Monitor vendor sales and manage daily commission billing.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunAggregation}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-ink border border-ink rounded-lg text-surface hover:bg-ink-muted transition-all text-sm font-semibold shadow-sm"
          >
            <Banknote className={`w-4 h-4 mr-2 ${loading ? "animate-pulse" : ""}`} />
            Run Daily Aggregation
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-surface border border-surface-muted rounded-lg text-ink-soft hover:text-ink hover:border-primary transition-all text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global commission rate — the single control that sets what every
          vendor without an override pays on each sale. */}
      <div className="bg-surface border border-surface-muted rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-primary/10 text-primary mr-4">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-inter text-ink">Platform commission rate</h2>
              <p className="text-sm mt-1 text-ink-soft max-w-xl">
                Charged on every sale made by every vendor. Changing it applies immediately
                across the vendor app and this page — vendors with a custom rate below are
                unaffected. Sales already recorded keep the rate they were charged at.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={globalRateInput}
                onChange={e => setGlobalRateInput(e.target.value)}
                className="w-28 pr-7 py-2 px-3 border border-surface-muted rounded-lg text-right text-ink bg-surface font-mono text-lg focus:outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">%</span>
            </div>
            <button
              onClick={handleSaveGlobalRate}
              disabled={parseFloat(globalRateInput) === globalRate || actionLoading === "global-rate"}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                parseFloat(globalRateInput) !== globalRate && actionLoading !== "global-rate"
                  ? "bg-primary text-surface hover:bg-primary-dim"
                  : "bg-surface-muted text-ink-muted cursor-not-allowed"
              }`}
            >
              {actionLoading === "global-rate" ? "Saving…" : "Save rate"}
            </button>
          </div>
        </div>
        {globalSaved && (
          <div className="flex items-center text-xs text-success font-bold mt-4">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Now charging {globalRate}% on every sale.
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Platform GMV", value: GHS(totalGMV), icon: TrendingUp, color: "text-primary" },
          { label: "Pending Commission", value: GHS(totalPending), icon: Clock, color: "text-amber-500" },
          { label: "Billed (Awaiting Payment)", value: GHS(totalBilled), icon: AlertCircle, color: "text-blue-500" },
          { label: "Collected (Paid)", value: GHS(totalPaid), icon: CheckCircle2, color: "text-emerald-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-surface-muted rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold font-inter ${color}`}>{mounted ? value : "—"}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface border border-surface-muted rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-surface-muted rounded-lg text-sm text-ink bg-surface focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-primary"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="billed">Billed</option>
          <option value="paid">Paid</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-primary" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-primary" />
        <button onClick={refresh}
          className="px-4 py-2 bg-primary text-surface rounded-lg text-sm font-bold hover:bg-primary-dim transition-colors flex items-center">
          <Filter className="w-4 h-4 mr-2" />Apply
        </button>
      </div>

      {/* Vendor Commission Table */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-surface border border-surface-muted rounded-xl p-12 text-center text-ink-muted">
            No commission data found. Commission entries are created automatically when orders are delivered.
          </div>
        ) : filtered.map(vendor => {
          const isExpanded = expanded === vendor.vendor_id;
          const pendingEntries = vendor.entries.filter(e => e.status === "pending");
          const hasPending = pendingEntries.length > 0;
          const hasBilled = vendor.entries.some(e => e.status === "billed");

          return (
            <div key={vendor.vendor_id} className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
              {/* Vendor Row */}
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-surface-soft/40 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : vendor.vendor_id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-ghost border border-primary/20">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{vendor.store_name}</p>
                    <p className="text-xs text-ink-muted">
                      @{vendor.store_slug} · Rate: <span className="font-bold text-ink-soft">{vendor.commission_rate}%</span>
                      {vendor.rate_is_custom ? " (custom)" : ` (platform default)`}
                    </p>
                  </div>
                  {vendor.is_verified && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 flex-shrink-0">
                      Verified
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center flex-shrink-0">
                  <div>
                    <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">GMV</p>
                    <p className="text-sm font-bold text-ink">{mounted ? GHS(vendor.total_gross) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Pending</p>
                    <p className="text-sm font-bold text-amber-500">{mounted ? GHS(vendor.pending_commission) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Billed</p>
                    <p className="text-sm font-bold text-blue-500">{mounted ? GHS(vendor.billed_commission) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Delivered</p>
                    <p className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-1">
                      <Package className="w-3.5 h-3.5" />{vendor.delivered_orders}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Cancelled</p>
                    <p className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />{vendor.cancelled_orders}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {hasPending && (
                    <button
                      onClick={() => handleBillAll(vendor)}
                      disabled={actionLoading === vendor.vendor_id}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      Bill Now
                    </button>
                  )}
                  {(hasBilled || hasPending) && (
                    <button
                      onClick={() => openPayModal(vendor)}
                      disabled={actionLoading === vendor.vendor_id}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Mark Paid
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-ink-muted" /> : <ChevronDown className="w-5 h-5 text-ink-muted" />}
                </div>
              </div>

              {/* Expanded: Entry Detail Table */}
              {isExpanded && (
                <div className="border-t border-surface-muted">
                  <div className="p-4 bg-surface-soft/30">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <h3 className="text-sm font-bold text-ink flex items-center">
                        <ReceiptText className="w-4 h-4 mr-2 text-ink-muted" />
                        Commission Ledger ({vendor.entries.length} entries)
                      </h3>
                      <div className="flex items-center gap-2 bg-surface p-2 rounded-lg border border-surface-muted shadow-sm">
                        <span className="text-xs font-bold text-ink-muted uppercase">Custom Rate:</span>
                        <input
                          type="number"
                          min="0" max="100" step="0.1"
                          placeholder={vendor.commission_rate.toString()}
                          value={rateInputs[vendor.vendor_id] ?? ""}
                          onChange={e => setRateInputs({...rateInputs, [vendor.vendor_id]: e.target.value})}
                          className="w-16 px-2 py-1 text-xs border border-surface-muted rounded text-right bg-surface text-ink focus:border-primary focus:outline-none"
                        />
                        <span className="text-xs text-ink-muted font-bold">%</span>
                        <button
                          onClick={() => handleSetCustomRate(vendor.vendor_id)}
                          disabled={!rateInputs[vendor.vendor_id] || actionLoading === vendor.vendor_id + "-rate"}
                          className="px-3 py-1 bg-ink text-surface text-xs font-bold rounded hover:bg-ink-soft transition-colors disabled:opacity-50"
                        >
                          {actionLoading === vendor.vendor_id + "-rate" ? "..." : "Save"}
                        </button>
                        {vendor.rate_is_custom && (
                          <button
                            onClick={() => handleClearCustomRate(vendor.vendor_id, vendor.store_name)}
                            disabled={actionLoading === vendor.vendor_id + "-rate"}
                            title={`Reset to the platform rate (${globalRate}%)`}
                            className="flex items-center gap-1 px-2 py-1 border border-surface-muted text-ink-soft text-xs font-bold rounded hover:border-primary hover:text-ink transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-left py-2 px-3">Order</th>
                            <th className="text-left py-2 px-3">Type</th>
                            <th className="text-right py-2 px-3">Gross</th>
                            <th className="text-right py-2 px-3">Rate</th>
                            <th className="text-right py-2 px-3">Commission</th>
                            <th className="text-left py-2 px-3">Status</th>
                            <th className="text-left py-2 px-3">Ref / Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-muted">
                          {vendor.entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-surface-soft/50 transition-colors">
                              <td className="py-2.5 px-3 text-ink-soft font-mono text-xs">
                                {mounted ? new Date(entry.period_date).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-xs text-ink-muted">
                                {entry.order_id ? entry.order_id.slice(0, 8) + "…" : "—"}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${entry.entry_type === "credit" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-surface-muted text-ink-soft border-surface-muted"}`}>
                                  {entry.entry_type === "credit" ? "↩ Refund Credit" : "Charge"}
                                </span>
                              </td>
                              <td className={`py-2.5 px-3 text-right font-mono font-bold ${entry.entry_type === "credit" ? "text-purple-600" : "text-ink"}`}>
                                {mounted ? (entry.entry_type === "credit" ? "−" : "") + GHS(entry.gross_amount) : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right text-ink-soft">{entry.commission_rate}%</td>
                              <td className={`py-2.5 px-3 text-right font-bold font-mono ${entry.entry_type === "credit" ? "text-purple-600" : "text-primary"}`}>
                                {mounted ? (entry.entry_type === "credit" ? "−" : "") + GHS(entry.commission_amount) : "—"}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[entry.status]}`}>
                                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-ink-muted max-w-xs truncate">
                                {entry.payment_reference || entry.admin_note || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-surface-muted bg-surface-soft">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 text-xs font-bold text-ink">TOTALS</td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-ink">{mounted ? GHS(vendor.total_gross) : "—"}</td>
                            <td></td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-primary">{mounted ? GHS(vendor.total_commission) : "—"}</td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mark Paid Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 border border-surface-muted">
            <h2 className="text-xl font-bold font-inter text-ink mb-1">Record Payment</h2>
            <p className="text-ink-muted text-sm mb-5">
              Marking <span className="font-bold text-emerald-600">{mounted ? GHS(payModal.total) : "—"}</span> as paid for {payModal.entryIds.length} commission entries.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-primary">
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Payment Reference (optional)</label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
                  placeholder="e.g. GH-TXN-12345"
                  className="w-full border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Admin Note (optional)</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)}
                  placeholder="Any notes..."
                  className="w-full border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPayModal(null)}
                className="flex-1 px-4 py-2.5 border border-surface-muted rounded-lg text-ink-soft hover:text-ink hover:border-primary transition-colors font-semibold text-sm">
                Cancel
              </button>
              <button onClick={handleMarkPaid} disabled={actionLoading !== null}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {actionLoading ? "Saving…" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
