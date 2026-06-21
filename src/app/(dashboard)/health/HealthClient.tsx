"use client";

import { Activity, Database, Users, Store, Package, FileText, CheckCircle2 } from "lucide-react";
import { type DatabaseHealth, type SystemAuditLog } from "@/lib/api";

export function HealthClient({ initialHealth, initialLogs }: { initialHealth: DatabaseHealth | null, initialLogs: SystemAuditLog[] }) {
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
          <Activity className="w-8 h-8 mr-3 text-primary" />
          System Health & Audit
        </h1>
        <p className="text-ink-soft mt-1">
          Monitor database health and track global administrative actions.
        </p>
      </div>

      {initialHealth && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-inter flex items-center">
            <Database className="w-5 h-5 mr-2 text-ink-muted" /> Database Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-surface rounded-xl p-5 border border-surface-muted shadow-sm">
              <div className="text-sm font-bold text-ink-muted mb-1 flex items-center">
                <Activity className="w-4 h-4 mr-1" /> Status
              </div>
              <div className="text-2xl font-black text-success flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-1" /> {initialHealth.status.toUpperCase()}
              </div>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-surface-muted shadow-sm">
              <div className="text-sm font-bold text-ink-muted mb-1 flex items-center">
                <Users className="w-4 h-4 mr-1" /> Total Users
              </div>
              <div className="text-3xl font-black font-inter text-ink">
                {initialHealth.total_users.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-surface-muted shadow-sm">
              <div className="text-sm font-bold text-ink-muted mb-1 flex items-center">
                <Store className="w-4 h-4 mr-1" /> Total Vendors
              </div>
              <div className="text-3xl font-black font-inter text-ink">
                {initialHealth.total_vendors.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-surface-muted shadow-sm">
              <div className="text-sm font-bold text-ink-muted mb-1 flex items-center">
                <Package className="w-4 h-4 mr-1" /> Total Products
              </div>
              <div className="text-3xl font-black font-inter text-ink">
                {initialHealth.total_products.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-surface-muted shadow-sm">
              <div className="text-sm font-bold text-ink-muted mb-1 flex items-center">
                <Database className="w-4 h-4 mr-1" /> DB Size (MB)
              </div>
              <div className="text-3xl font-black font-inter text-ink">
                {initialHealth.db_size_mb}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-inter flex items-center mt-8">
          <FileText className="w-5 h-5 mr-2 text-ink-muted" /> Audit Trail
        </h2>
        <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-muted">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Admin ID</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-muted">
                {initialLogs.length > 0 ? initialLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-soft/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft font-mono">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-surface-muted text-ink-soft">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ink">
                      {log.target_id || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted max-w-xs">
                      {(() => {
                        if (!log.details) return "-";
                        try {
                          const parsed = JSON.parse(log.details);
                          return (
                            <div className="space-y-0.5">
                              {Object.entries(parsed).map(([k, v]) => (
                                <div key={k} className="truncate">
                                  <span className="font-bold text-ink-soft">{k}:</span>{" "}
                                  <span className="font-mono">{String(typeof v === "object" ? JSON.stringify(v) : v)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        } catch {
                          return <span className="truncate">{log.details}</span>;
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ink-soft">
                      {log.admin_id || "System"}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-ink-muted">No audit logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
