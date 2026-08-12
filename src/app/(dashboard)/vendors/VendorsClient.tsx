"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Eye, Ban, Trash2, TriangleAlert } from "lucide-react";
import { clientApi, type Vendor } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, SearchInput, Select } from "@/components/ui/Filters";
import { DataView, DataCard, CardField, CardActions } from "@/components/ui/DataView";
import { useFeedback } from "@/components/ui/Feedback";
import { formatDate, shortId } from "@/lib/utils";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:8081";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "flagged", label: "Flagged" },
];

export function VendorsClient({ initialVendors }: { initialVendors: Vendor[] }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();

  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  // A flagged-vendor notification links here as /vendors?flagged=<id> so the
  // offending store is highlighted the moment the admin taps the bell.
  const flaggedId = useSearchParams().get("flagged");

  const name = (vendor: Vendor) => vendor.store_name || "Unnamed store";

  const revoke = async (vendor: Vendor) => {
    const ok = await confirm({
      title: "Revoke verification?",
      message: `${name(vendor)} loses access to the vendor app until they're approved again. Their listings stay in the catalog.`,
      confirmLabel: "Revoke verification",
      destructive: true,
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/vendors/${vendor.id}/revoke`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setVendors((current) =>
        current.map((v) => (v.id === vendor.id ? { ...v, is_verified: false } : v))
      );
      toast(`${name(vendor)} unverified.`, "success");
      router.refresh();
    } catch {
      toast("Could not revoke that vendor.", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (vendor: Vendor) => {
    const ok = await confirm({
      title: "Delete this vendor?",
      message: `${name(vendor)} and every product they've listed will be deleted permanently. This cannot be undone.`,
      confirmLabel: "Delete vendor",
      destructive: true,
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/vendors/${vendor.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setVendors((current) => current.filter((v) => v.id !== vendor.id));
      toast("Vendor deleted.", "success");
      router.refresh();
    } catch {
      toast("Could not delete that vendor.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = vendors.filter((vendor) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      vendor.store_name?.toLowerCase().includes(query) ||
      vendor.owner_id?.toLowerCase().includes(query);
    const matchesStatus =
      status === "all" ||
      (status === "verified" && vendor.is_verified) ||
      (status === "unverified" && !vendor.is_verified) ||
      (status === "flagged" && vendor.flagged_for_cancellations);
    return matchesSearch && matchesStatus;
  });

  const statusBadges = (vendor: Vendor) => (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={vendor.is_verified ? "success" : "warning"}>
        {vendor.is_verified ? "Verified" : "Unverified"}
      </Badge>
      {vendor.flagged_for_cancellations && (
        <Badge tone="error" icon={<TriangleAlert className="h-3 w-3" />}>
          {vendor.cancellation_count ?? 0} cancellations
        </Badge>
      )}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Vendors"
        icon={<Store className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Registered storefronts. Pending applications live in Approvals."
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search stores by name…"
        />
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} label="Status" />
      </FilterBar>

      <DataView
        items={filtered}
        keyOf={(vendor) => vendor.id}
        rowClassName={(vendor) =>
          flaggedId && vendor.id === flaggedId
            ? "bg-error-ghost ring-1 ring-error rounded-2xl md:rounded-none md:ring-0"
            : vendor.flagged_for_cancellations
              ? "bg-warning-ghost/40"
              : ""
        }
        empty={
          <EmptyState
            icon={<Store className="h-10 w-10" />}
            title="No vendors match"
            message="Try clearing the search or the status filter."
          />
        }
        columns={[
          {
            header: "Store",
            cell: (vendor) => (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-surface-deep bg-surface-muted text-ink-muted">
                  <Store className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-inter text-sm font-semibold text-ink">
                    {name(vendor)}
                  </p>
                  <p className="font-open-sans text-xs text-ink-muted">
                    Joined {formatDate(vendor.created_at)}
                  </p>
                </div>
              </div>
            ),
          },
          {
            header: "Owner",
            hideBelow: "lg",
            cell: (vendor) => (
              <span className="font-mono text-xs text-ink-muted">
                {shortId(vendor.owner_id ?? "—", 12)}
              </span>
            ),
          },
          { header: "Status", cell: statusBadges },
          {
            header: "Actions",
            align: "right",
            cell: (vendor) => (
              <div className="flex justify-end gap-1">
                <a
                  href={`${STOREFRONT}/vendor/${vendor.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${name(vendor)} storefront`}
                  title="Open storefront"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-info transition-colors hover:bg-info-ghost"
                >
                  <Eye className="h-4 w-4" />
                </a>
                {vendor.is_verified && (
                  <IconButton
                    label={`Revoke ${name(vendor)}`}
                    tone="warning"
                    disabled={loading}
                    onClick={() => revoke(vendor)}
                    icon={<Ban className="h-4 w-4" />}
                  />
                )}
                <IconButton
                  label={`Delete ${name(vendor)}`}
                  tone="danger"
                  disabled={loading}
                  onClick={() => remove(vendor)}
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </div>
            ),
          },
        ]}
        card={(vendor) => (
          <DataCard
            accent={
              vendor.flagged_for_cancellations
                ? "error"
                : vendor.is_verified
                  ? "success"
                  : "warning"
            }
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-surface-deep bg-surface-muted text-ink-muted">
                <Store className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-inter text-sm font-semibold text-ink">{name(vendor)}</p>
                <p className="font-open-sans text-xs text-ink-muted">
                  Joined {formatDate(vendor.created_at)}
                </p>
                <div className="mt-2">{statusBadges(vendor)}</div>
              </div>
            </div>

            <div className="mt-3">
              <CardField label="Owner" value={shortId(vendor.owner_id ?? "—", 16)} />
            </div>

            <CardActions>
              <a
                href={`${STOREFRONT}/vendor/${vendor.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-inter text-[13px] font-semibold text-info transition-colors hover:bg-info-ghost"
              >
                <Eye className="h-4 w-4" /> Storefront
              </a>
              {vendor.is_verified && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => revoke(vendor)}
                  icon={<Ban className="h-4 w-4" />}
                  className="text-warning hover:bg-warning-ghost"
                >
                  Revoke
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => remove(vendor)}
                icon={<Trash2 className="h-4 w-4" />}
                className="text-error hover:bg-error-ghost"
              >
                Delete
              </Button>
            </CardActions>
          </DataCard>
        )}
      />
    </div>
  );
}
