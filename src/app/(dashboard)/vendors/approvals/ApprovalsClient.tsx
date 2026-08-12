"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, AlertCircle, ClipboardCheck, ExternalLink } from "lucide-react";
import { clientApi, type VendorApplication } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, SearchInput, Select, Field, TextArea } from "@/components/ui/Filters";
import { DataView, DataCard, CardField, CardActions } from "@/components/ui/DataView";
import { useFeedback } from "@/components/ui/Feedback";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE = {
  approved: "success",
  rejected: "error",
  pending: "warning",
} as const;

export function ApprovalsClient({ initialApps }: { initialApps: VendorApplication[] }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();

  const [apps, setApps] = useState<VendorApplication[]>(initialApps);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VendorApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const review = async (app: VendorApplication, decision: "approved" | "rejected") => {
    const ok = await confirm({
      title: decision === "approved" ? "Approve this vendor?" : "Reject this application?",
      message:
        decision === "approved"
          ? `${app.business_name} gets a verified storefront and immediate access to the vendor app.`
          : `${app.business_name} is turned down. Your notes are shared with the applicant, so make the reason clear.`,
      confirmLabel: decision === "approved" ? "Approve vendor" : "Reject application",
      destructive: decision === "rejected",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/vendors/applications/${app.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, admin_notes: notes }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: VendorApplication = await res.json();
      setApps((current) => current.map((a) => (a.id === app.id ? updated : a)));
      setSelected(null);
      setNotes("");
      toast(
        decision === "approved"
          ? `${app.business_name} approved.`
          : `${app.business_name} rejected.`,
        decision === "approved" ? "success" : "warning"
      );
      router.refresh();
    } catch {
      toast("Could not submit that review.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = apps.filter((app) => {
    const matchesSearch = app.business_name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = status === "all" || app.status === status;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Approvals"
        icon={<ClipboardCheck className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description={
          pendingCount > 0
            ? `${pendingCount} application${pendingCount === 1 ? "" : "s"} waiting on you.`
            : "New vendor applications and their KYC documents."
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by business name…"
        />
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} label="Status" />
      </FilterBar>

      <DataView
        items={filtered}
        keyOf={(app) => app.id}
        empty={
          <EmptyState
            icon={<ClipboardCheck className="h-10 w-10" />}
            title="Nothing to review"
            message="New vendor applications will appear here as they come in."
          />
        }
        columns={[
          {
            header: "Business",
            cell: (app) => (
              <div className="min-w-0">
                <p className="font-inter text-sm font-semibold text-ink">
                  {app.business_name}
                </p>
                <p className="font-mono text-xs text-ink-muted">
                  Reg: {app.business_registration_number || "N/A"}
                </p>
              </div>
            ),
          },
          {
            header: "Documents",
            hideBelow: "lg",
            cell: (app) => (
              <Badge tone={app.documents.length > 0 ? "neutral" : "error"}>
                {app.documents.length > 0 ? `${app.documents.length} files` : "None"}
              </Badge>
            ),
          },
          {
            header: "Status",
            cell: (app) => (
              <Badge tone={STATUS_TONE[app.status] ?? "neutral"}>{app.status}</Badge>
            ),
          },
          {
            header: "Applied",
            cell: (app) => (
              <span className="whitespace-nowrap font-open-sans text-sm text-ink-soft">
                {formatDate(app.applied_at)}
              </span>
            ),
          },
          {
            header: "Actions",
            align: "right",
            cell: (app) => (
              <IconButton
                label={`Review ${app.business_name}`}
                tone="primary"
                onClick={() => {
                  setSelected(app);
                  setNotes("");
                }}
                icon={<Eye className="h-4 w-4" />}
              />
            ),
          },
        ]}
        card={(app) => (
          <DataCard
            accent={
              app.status === "pending"
                ? "warning"
                : app.status === "approved"
                  ? "success"
                  : "error"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-inter text-sm font-semibold text-ink">
                  {app.business_name}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                  Reg: {app.business_registration_number || "N/A"}
                </p>
              </div>
              <Badge tone={STATUS_TONE[app.status] ?? "neutral"}>{app.status}</Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <CardField label="Applied" value={formatDate(app.applied_at)} />
              <CardField
                label="Documents"
                value={
                  app.documents.length > 0 ? (
                    `${app.documents.length} uploaded`
                  ) : (
                    <span className="text-error">None provided</span>
                  )
                }
              />
            </div>

            <CardActions>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelected(app);
                  setNotes("");
                }}
                icon={<Eye className="h-4 w-4" />}
              >
                Review application
              </Button>
            </CardActions>
          </DataCard>
        )}
      />

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Review application"
        description={selected?.business_name}
        size="lg"
        footer={
          selected?.status === "pending" ? (
            <>
              <Button
                variant="destructive"
                onClick={() => selected && review(selected, "rejected")}
                disabled={loading}
                className="sm:w-auto"
                block
              >
                Reject
              </Button>
              <Button
                onClick={() => selected && review(selected, "approved")}
                disabled={loading}
                className="sm:w-auto"
                block
              >
                Approve vendor
              </Button>
            </>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Business details
              </h3>
              <div className="space-y-1 rounded-xl border border-surface-muted bg-surface-soft p-3">
                <p className="font-inter text-base font-semibold text-ink">
                  {selected.business_name}
                </p>
                <p className="font-open-sans text-sm text-ink-soft">
                  Reg: {selected.business_registration_number || "Not provided"}
                </p>
                <p className="truncate font-mono text-xs text-ink-muted">
                  User: {selected.user_id}
                </p>
              </div>
            </section>

            {selected.admin_notes && (
              <section>
                <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Store bio
                </h3>
                <p className="rounded-xl border border-surface-muted bg-surface-soft p-3 font-open-sans text-sm text-ink-soft">
                  {selected.admin_notes}
                </p>
              </section>
            )}

            <section>
              <h3 className="mb-2 font-inter text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                KYC documents
              </h3>
              {selected.documents.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-error-ghost p-3 font-open-sans text-sm font-semibold text-error">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  No KYC documents provided.
                </div>
              ) : (
                <ul className="space-y-2">
                  {selected.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-surface-muted bg-surface-soft p-3 transition-colors hover:border-primary-border"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 flex-shrink-0 text-ink-muted" />
                          <span className="truncate font-inter text-sm font-semibold capitalize text-ink">
                            {doc.document_type}
                          </span>
                        </span>
                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-ink-muted" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {selected.status === "pending" ? (
              <Field
                label="Admin notes"
                hint="Shared with the applicant — give a clear reason if you reject."
              >
                <TextArea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for the decision, or internal notes…"
                />
              </Field>
            ) : (
              <div className="rounded-xl border border-surface-muted bg-surface-soft p-3">
                <p className="font-open-sans text-sm text-ink-soft">
                  This application was already{" "}
                  <strong className="font-semibold text-ink">{selected.status}</strong>
                  {selected.reviewed_at ? ` on ${formatDate(selected.reviewed_at)}` : ""}.
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
