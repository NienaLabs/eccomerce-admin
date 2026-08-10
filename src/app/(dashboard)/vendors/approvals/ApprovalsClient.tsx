
"use client";

import { useState } from "react";
import { X, Eye, FileText, AlertCircle, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { clientApi, type VendorApplication } from "@/lib/api";

export function ApprovalsClient({ initialApps }: { initialApps: VendorApplication[] }) {
  const router = useRouter();
  const [apps, setApps] = useState<VendorApplication[]>(initialApps);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleReview = async (appId: string, status: "approved" | "rejected") => {
    try {
      setLoading(true);
      const res = await clientApi(`/admin/vendors/applications/${appId}/review`, {
        method: "POST",
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });
      if (res.ok) {
        const updatedApp = await res.json();
        setApps(apps.map(a => a.id === appId ? updatedApp : a));
        setSelectedApp(null);
        setAdminNotes("");
        router.refresh();
      } else {
        alert("Failed to review application.");
      }
    } catch {
      alert("Network Error.");
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
          Vendor Approvals
        </h1>
        <p className="text-ink-soft mt-1">
          Review new vendor applications and verify KYC documents.
        </p>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search by business name..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-muted">
          <thead className="bg-surface-soft">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Business</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Applied</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-surface-muted">
            {filteredApps.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-ink-muted">No applications found.</td></tr>
            )}
            {filteredApps.map((app) => (
              <tr key={app.id} className="hover:bg-surface-soft/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-ink font-inter">{app.business_name}</div>
                  <div className="text-xs text-ink-soft font-mono">Reg: {app.business_registration_number || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-success-ghost text-success' : app.status === 'rejected' ? 'bg-error-ghost text-error' : 'bg-warning-ghost text-warning'}`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-ink-soft">
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedApp(app)} className="text-primary hover:text-primary-dim font-bold inline-flex items-center">
                    <Eye className="w-4 h-4 mr-1" /> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-surface-muted flex justify-between items-center bg-surface-soft">
              <h2 className="text-xl font-bold font-inter">Review Application</h2>
              <button onClick={() => setSelectedApp(null)} className="text-ink-muted hover:text-ink"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-ink-muted uppercase">Business Details</h3>
                <p className="font-bold text-lg mt-1">{selectedApp.business_name}</p>
                <p className="text-ink-soft">{selectedApp.business_registration_number}</p>
                <p className="text-ink-soft">User ID: {selectedApp.user_id}</p>
                {selectedApp.admin_notes && (
                  <div className="mt-4 p-3 bg-surface-soft border border-surface-muted rounded-lg">
                    <p className="text-sm font-bold text-ink-muted mb-1">Store Bio:</p>
                    <p className="text-sm text-ink">{selectedApp.admin_notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-ink-muted uppercase mb-3">KYC Documents</h3>
                {selectedApp.documents.length === 0 ? (
                  <div className="flex items-center text-error text-sm font-bold bg-error-ghost p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" /> No KYC documents provided.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedApp.documents.map(doc => (
                      <div key={doc.id} className="border border-surface-muted rounded-lg p-3 flex justify-between items-center bg-surface-soft">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-3 text-primary" />
                          <span className="font-bold capitalize">{doc.document_type}</span>
                        </div>
                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-bold hover:underline">View Document</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedApp.status === "pending" && (
                <div>
                  <h3 className="text-sm font-bold text-ink-muted uppercase mb-2">Admin Notes</h3>
                  <textarea
                    className="w-full rounded-md border border-surface-deep bg-surface px-3 py-2 text-ink focus:border-primary focus:outline-none"
                    rows={3}
                    placeholder="Add reasons for rejection or internal notes..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <div className="flex gap-3 mt-4 justify-end">
                    <button
                      disabled={loading}
                      onClick={() => handleReview(selectedApp.id, "rejected")}
                      className="px-4 py-2 bg-error-ghost text-error rounded-md font-bold hover:bg-error hover:text-surface transition-colors"
                    >
                      Reject Application
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleReview(selectedApp.id, "approved")}
                      className="px-4 py-2 bg-success text-surface rounded-md font-bold hover:bg-success-dim transition-colors"
                    >
                      Approve Vendor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
