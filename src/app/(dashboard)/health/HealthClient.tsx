"use client";

import { Activity, Database, Users, Store, Package, FileText, CheckCircle2 } from "lucide-react";
import type { DatabaseHealth, SystemAuditLog } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataView, DataCard, CardField } from "@/components/ui/DataView";
import { LocaleNumber } from "@/components/ui/LocaleNumber";
import { formatDateTime, shortId } from "@/lib/utils";

/** Parse outside the render path — JSX must not be constructed inside try/catch. */
function parseDetails(details: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(details);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Audit `details` is a JSON string; render it as readable pairs when it parses. */
function AuditDetails({ details }: { details: string | null }) {
  if (!details) return <span className="text-ink-muted">—</span>;

  const parsed = parseDetails(details);
  if (!parsed) {
    return <span className="truncate font-open-sans text-xs text-ink-muted">{details}</span>;
  }

  return (
    <div className="space-y-0.5">
      {Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="truncate font-open-sans text-xs">
          <span className="font-semibold text-ink-soft">{key}:</span>{" "}
          <span className="font-mono text-ink-muted">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HealthClient({
  initialHealth,
  initialLogs,
}: {
  initialHealth: DatabaseHealth | null;
  initialLogs: SystemAuditLog[];
}) {
  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader
        title="Health & Audit"
        icon={<Activity className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Database metrics and the trail of every administrative action."
      />

      {initialHealth ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-inter text-base font-bold text-ink sm:text-lg">
            <Database className="h-4 w-4 text-ink-muted" /> Database
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard
              label="Status"
              tone="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
              value={
                <span className="text-success">{initialHealth.status.toUpperCase()}</span>
              }
            />
            <StatCard
              label="Users"
              icon={<Users className="h-5 w-5" />}
              value={<LocaleNumber value={initialHealth.total_users} />}
            />
            <StatCard
              label="Vendors"
              icon={<Store className="h-5 w-5" />}
              value={<LocaleNumber value={initialHealth.total_vendors} />}
            />
            <StatCard
              label="Products"
              icon={<Package className="h-5 w-5" />}
              value={<LocaleNumber value={initialHealth.total_products} />}
            />
            <StatCard
              label="DB size"
              icon={<Database className="h-5 w-5" />}
              value={`${initialHealth.db_size_mb} MB`}
            />
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<Database className="h-10 w-10" />}
          title="Health check unavailable"
          message="The backend didn't return database metrics."
        />
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-inter text-base font-bold text-ink sm:text-lg">
          <FileText className="h-4 w-4 text-ink-muted" /> Audit trail
        </h2>

        <DataView
          items={initialLogs}
          keyOf={(log) => log.id}
          empty={
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="No audit entries"
              message="Administrative actions are recorded here as they happen."
            />
          }
          columns={[
            {
              header: "When",
              cell: (log) => (
                <span className="whitespace-nowrap font-open-sans text-sm text-ink-soft">
                  {formatDateTime(log.created_at)}
                </span>
              ),
            },
            {
              header: "Action",
              cell: (log) => <Badge tone="neutral">{log.action}</Badge>,
            },
            {
              header: "Target",
              hideBelow: "lg",
              cell: (log) => (
                <span className="font-mono text-xs text-ink">
                  {log.target_id ? shortId(log.target_id, 14) : "—"}
                </span>
              ),
            },
            {
              header: "Details",
              cell: (log) => (
                <div className="max-w-xs">
                  <AuditDetails details={log.details} />
                </div>
              ),
            },
            {
              header: "Admin",
              hideBelow: "xl",
              cell: (log) => (
                <span className="font-mono text-xs text-ink-soft">
                  {log.admin_id ? shortId(log.admin_id) : "System"}
                </span>
              ),
            },
          ]}
          card={(log) => (
            <DataCard>
              <div className="flex items-start justify-between gap-3">
                <Badge tone="neutral">{log.action}</Badge>
                <span className="flex-shrink-0 font-open-sans text-xs text-ink-muted">
                  {formatDateTime(log.created_at)}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <CardField
                  label="Target"
                  value={
                    <span className="font-mono text-xs">
                      {log.target_id ? shortId(log.target_id, 18) : "—"}
                    </span>
                  }
                />
                <CardField
                  label="Admin"
                  value={
                    <span className="font-mono text-xs">
                      {log.admin_id ? shortId(log.admin_id, 18) : "System"}
                    </span>
                  }
                />
                {log.details && (
                  <div>
                    <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Details
                    </p>
                    <div className="mt-0.5">
                      <AuditDetails details={log.details} />
                    </div>
                  </div>
                )}
              </div>
            </DataCard>
          )}
        />
      </section>
    </div>
  );
}
