"use client";

import { useState } from "react";
import { Store, Eye, Search, Filter, Ban, Trash2, AlertTriangle } from "lucide-react";
import { type Vendor, API_BASE_URL } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export function VendorsClient({ initialVendors, token }: { initialVendors: Vendor[]; token: string }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // A flagged-vendor notification links here as /vendors?flagged=<id> so we can
  // highlight the offending store the moment the admin clicks the bell.
  const flaggedId = useSearchParams().get("flagged");

  const handleRevoke = async (vendorId: string) => {
    if (!confirm("Are you sure you want to revoke this vendor's verification? They will lose access to the vendor app until re-approved.")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/revoke`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setVendors(vendors.map(v => v.id === vendorId ? { ...v, is_verified: false } : v));
        router.refresh();
      } else alert("Failed to revoke vendor.");
    } catch {
      alert("Network Error: Failed to revoke vendor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm("Are you sure you want to permanently delete this vendor and all their products?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setVendors(vendors.filter(v => v.id !== vendorId));
        router.refresh();
      } else alert("Failed to delete vendor.");
    } catch {
      alert("Network Error: Failed to delete vendor.");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      vendor.store_name?.toLowerCase().includes(q) ||
      vendor.owner_id?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" ||
                          (statusFilter === "verified" && vendor.is_verified) ||
                          (statusFilter === "unverified" && !vendor.is_verified) ||
                          (statusFilter === "flagged" && vendor.flagged_for_cancellations);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
          Vendor Management
        </h1>
        <p className="text-ink-soft mt-1">
          View all registered vendor storefronts. Pending applications are managed in the Approvals queue.
        </p>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search stores by name..."
            className="w-full pl-10 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-ghost" />
          <select
            className="w-full pl-9 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="flagged">Flagged (cancellations)</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-muted">
            <thead className="bg-surface-soft">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Store</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Owner ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-surface-muted">
              {filteredVendors.length > 0 ? filteredVendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className={`transition-colors ${
                    flaggedId && vendor.id === flaggedId
                      ? "bg-error-ghost/60"
                      : vendor.flagged_for_cancellations
                        ? "bg-warning-ghost/30 hover:bg-warning-ghost/50"
                        : "hover:bg-surface-soft/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center text-ink-muted border border-surface-deep">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-ink font-inter">
                          {vendor.store_name || "Unnamed Store"}
                        </div>
                        <div className="text-xs text-ink-soft">
                          Joined: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-muted font-mono">
                    {vendor.owner_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${vendor.is_verified ? 'bg-success-ghost text-success' : 'bg-warning-ghost text-warning'}`}>
                        {vendor.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                      {vendor.flagged_for_cancellations && (
                        <span
                          title="This vendor has cancelled several orders. Consider revoking or banning."
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error-ghost text-error"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {vendor.cancellation_count ?? 0} cancellations
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                    <a href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:8081"}/vendor/${vendor.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-info hover:text-info/80 font-bold">
                      <Eye className="w-4 h-4 mr-1" /> Storefront
                    </a>
                    {vendor.is_verified && (
                      <button 
                        disabled={loading}
                        onClick={() => handleRevoke(vendor.id)} 
                        className="inline-flex items-center text-warning hover:text-warning/80 font-bold disabled:opacity-50 ml-2"
                      >
                        <Ban className="w-4 h-4 mr-1"/> Revoke
                      </button>
                    )}
                    <button 
                      disabled={loading}
                      onClick={() => handleDelete(vendor.id)} 
                      className="inline-flex items-center text-error hover:text-error/80 font-bold disabled:opacity-50 ml-2"
                    >
                      <Trash2 className="w-4 h-4 mr-1"/> Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">No vendors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
