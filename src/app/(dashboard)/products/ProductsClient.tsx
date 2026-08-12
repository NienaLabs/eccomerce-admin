"use client";

import { useState } from "react";
import { Package, Eye, Edit3, Trash2, Tag, ShieldCheck } from "lucide-react";
import { clientApi, type AdminProduct } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, SearchInput, Select, Field, TextInput } from "@/components/ui/Filters";
import { DataView, DataCard, CardField, CardActions } from "@/components/ui/DataView";
import { LocaleNumber } from "@/components/ui/LocaleNumber";
import { useFeedback } from "@/components/ui/Feedback";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:8081";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

export function ProductsClient({
  initialProducts,
  /** Featured Listings reuses this component and supplies its own header. */
  showHeader = true,
}: {
  initialProducts: AdminProduct[];
  showHeader?: boolean;
}) {
  const { toast, confirm } = useFeedback();

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [priceOverride, setPriceOverride] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const patch = async (product: AdminProduct, body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await clientApi(`/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: AdminProduct = await res.json();
      setProducts((current) =>
        current.map((p) => (p.id === product.id ? updated : p))
      );
      return updated;
    } catch {
      toast("Could not update the product.", "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (product: AdminProduct) => {
    const updated = await patch(product, { is_active: !product.is_active });
    if (updated) {
      toast(updated.is_active ? "Product is live." : "Product hidden from shoppers.", "success");
    }
  };

  const toggleFeatured = async (product: AdminProduct) => {
    const updated = await patch(product, { is_featured: !product.is_featured });
    if (updated) {
      toast(updated.is_featured ? "Added to featured." : "Removed from featured.", "success");
    }
  };

  const savePriceOverride = async () => {
    if (!editing) return;
    const trimmed = priceOverride.trim();
    const value = trimmed ? Number(trimmed) : null;
    if (trimmed && (!Number.isFinite(value) || (value as number) < 0)) {
      toast("Enter a valid price, or leave it empty to remove the override.", "warning");
      return;
    }
    const updated = await patch(editing, { admin_price_override: value });
    if (updated) {
      setEditing(null);
      toast(value === null ? "Override removed." : "Price override saved.", "success");
    }
  };

  const remove = async (product: AdminProduct) => {
    const ok = await confirm({
      title: "Delete this product?",
      message: `"${product.name}" will be removed from the marketplace permanently. This cannot be undone.`,
      confirmLabel: "Delete product",
      destructive: true,
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setProducts((current) => current.filter((p) => p.id !== product.id));
      toast("Product deleted.", "success");
    } catch {
      toast("Could not delete the product.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      status === "all" ||
      (status === "active" && product.is_active) ||
      (status === "disabled" && !product.is_active);
    return matchesSearch && matchesStatus;
  });

  const priceCell = (product: AdminProduct) => (
    <div className="flex flex-col">
      <span
        className={`font-inter text-sm font-bold ${
          product.admin_price_override ? "text-ink-muted line-through" : "text-ink"
        }`}
      >
        <LocaleNumber value={product.actual_price} currency />
      </span>
      {product.admin_price_override != null && (
        <span className="flex items-center gap-1 font-inter text-sm font-bold text-ink">
          <Tag className="h-3 w-3" />
          <LocaleNumber value={product.admin_price_override} currency />
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {showHeader && (
        <PageHeader
          title="Products"
          description="Every listing on the platform. Set featured items and override vendor pricing."
        />
      )}

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products by name…"
        />
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} label="Status" />
      </FilterBar>

      <DataView
        items={filtered}
        keyOf={(product) => product.id}
        empty={
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="No products found"
            message={
              search || status !== "all"
                ? "Nothing matches those filters."
                : "No vendor has listed a product yet."
            }
          />
        }
        columns={[
          {
            header: "Product",
            cell: (product) => (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-surface-deep bg-surface-muted text-ink-muted">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="max-w-[220px] truncate font-inter text-sm font-semibold text-ink">
                    {product.name}
                  </p>
                  <p className="max-w-[220px] truncate font-mono text-xs text-ink-muted">
                    {product.vendor_id}
                  </p>
                </div>
              </div>
            ),
          },
          { header: "Pricing", cell: priceCell },
          {
            header: "Status",
            cell: (product) => (
              <div className="flex flex-col items-start gap-1.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => toggleActive(product)}
                  // The badge is 22px by spec; the button pads the hitbox out
                  // to the 44px minimum without inflating the badge itself.
                  className="inline-flex min-h-11 items-center rounded-full disabled:opacity-50"
                >
                  <Badge tone={product.is_active ? "success" : "error"}>
                    {product.is_active ? "Active" : "Disabled"}
                  </Badge>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => toggleFeatured(product)}
                  // The badge is 22px by spec; the button pads the hitbox out
                  // to the 44px minimum without inflating the badge itself.
                  className="inline-flex min-h-11 items-center rounded-full disabled:opacity-50"
                >
                  <Badge tone={product.is_featured ? "primary" : "neutral"}>
                    {product.is_featured ? "Featured" : "Not featured"}
                  </Badge>
                </button>
              </div>
            ),
          },
          {
            header: "Actions",
            align: "right",
            cell: (product) => (
              <div className="flex justify-end gap-1">
                <a
                  href={`${STOREFRONT}/product/${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View on storefront"
                  title="View on storefront"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-info transition-colors hover:bg-info-ghost"
                >
                  <Eye className="h-4 w-4" />
                </a>
                <IconButton
                  label="Override price"
                  tone="primary"
                  onClick={() => {
                    setEditing(product);
                    setPriceOverride(product.admin_price_override?.toString() ?? "");
                  }}
                  icon={<Edit3 className="h-4 w-4" />}
                />
                <IconButton
                  label="Delete product"
                  tone="danger"
                  disabled={loading}
                  onClick={() => remove(product)}
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </div>
            ),
          },
        ]}
        card={(product) => (
          <DataCard>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-surface-deep bg-surface-muted text-ink-muted">
                <Package className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-inter text-sm font-semibold text-ink">{product.name}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                  {product.vendor_id}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <CardField label="Price" value={priceCell(product)} />
              <div className="flex flex-wrap justify-end gap-1.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => toggleActive(product)}
                  // The badge is 22px by spec; the button pads the hitbox out
                  // to the 44px minimum without inflating the badge itself.
                  className="inline-flex min-h-11 items-center rounded-full disabled:opacity-50"
                >
                  <Badge tone={product.is_active ? "success" : "error"}>
                    {product.is_active ? "Active" : "Disabled"}
                  </Badge>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => toggleFeatured(product)}
                  // The badge is 22px by spec; the button pads the hitbox out
                  // to the 44px minimum without inflating the badge itself.
                  className="inline-flex min-h-11 items-center rounded-full disabled:opacity-50"
                >
                  <Badge tone={product.is_featured ? "primary" : "neutral"}>
                    {product.is_featured ? "Featured" : "Not featured"}
                  </Badge>
                </button>
              </div>
            </div>

            <CardActions>
              <a
                href={`${STOREFRONT}/product/${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-inter text-[13px] font-semibold text-info transition-colors hover:bg-info-ghost"
              >
                <Eye className="h-4 w-4" /> View
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(product);
                  setPriceOverride(product.admin_price_override?.toString() ?? "");
                }}
                icon={<Edit3 className="h-4 w-4" />}
              >
                Price
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => remove(product)}
                icon={<Trash2 className="h-4 w-4" />}
                className="text-error hover:bg-error-ghost"
              >
                Delete
              </Button>
            </CardActions>
          </DataCard>
        )}
      />

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Override price"
        description={editing?.name}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditing(null)}
              className="sm:w-auto"
              block
            >
              Cancel
            </Button>
            <Button
              onClick={savePriceOverride}
              disabled={loading}
              icon={<ShieldCheck className="h-4 w-4" />}
              className="sm:w-auto"
              block
            >
              {loading ? "Saving…" : "Save override"}
            </Button>
          </>
        }
      >
        <Field
          label="Admin price (GH₵)"
          hint="Leave empty to remove the override and fall back to the vendor's price."
        >
          <TextInput
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value)}
            placeholder={editing ? editing.actual_price.toFixed(2) : "0.00"}
          />
        </Field>
      </Sheet>
    </div>
  );
}
