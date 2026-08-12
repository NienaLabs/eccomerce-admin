"use client";

import { useMemo, useState } from "react";
import { Timer, Plus, Trash2, Pencil, Package, Check, X } from "lucide-react";
import { clientApi, type FlashSale, type AdminProduct } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput, SearchInput } from "@/components/ui/Filters";
import { DataView, DataCard, CardField, CardActions } from "@/components/ui/DataView";
import { LocaleNumber } from "@/components/ui/LocaleNumber";
import { useFeedback } from "@/components/ui/Feedback";
import { formatDateTime, cn } from "@/lib/utils";

/**
 * Control surface for the app's flash-sale screen.
 *
 * That screen previously showed any discounted product and counted down to a
 * timestamp hard-coded in the mobile app. A sale is now a scheduled thing with
 * its own window and product set, and this is where it's set up.
 */

interface Draft {
  id?: string;
  title: string;
  subtitle: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  items: Record<string, string>; // productId -> sale price (blank = keep product's own)
}

/** A datetime-local input needs "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyDraft = (): Draft => {
  const start = new Date();
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return {
    title: "",
    subtitle: "",
    startsAt: toLocalInput(start.toISOString()),
    endsAt: toLocalInput(end.toISOString()),
    isActive: false,
    items: {},
  };
};

function statusOf(sale: FlashSale): { label: string; tone: "success" | "info" | "neutral" | "warning" } {
  const now = Date.now();
  const start = new Date(sale.starts_at).getTime();
  const end = new Date(sale.ends_at).getTime();
  if (!sale.is_active) return { label: "Draft", tone: "neutral" };
  if (now < start) return { label: "Scheduled", tone: "info" };
  if (now > end) return { label: "Ended", tone: "neutral" };
  return { label: "Live", tone: "success" };
}

export function FlashSalesClient({
  initialSales,
  products,
}: {
  initialSales: FlashSale[];
  products: AdminProduct[];
}) {
  const { toast, confirm } = useFeedback();

  const [sales, setSales] = useState<FlashSale[]>(initialSales);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [products, pickerSearch]);

  const openCreate = () => setDraft(emptyDraft());

  const openEdit = (sale: FlashSale) =>
    setDraft({
      id: sale.id,
      title: sale.title,
      subtitle: sale.subtitle ?? "",
      startsAt: toLocalInput(sale.starts_at),
      endsAt: toLocalInput(sale.ends_at),
      isActive: sale.is_active,
      items: Object.fromEntries(
        sale.items.map((i) => [i.product_id, i.sale_price != null ? String(i.sale_price) : ""])
      ),
    });

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast("Give the sale a title.", "warning");
      return;
    }
    if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
      toast("The sale has to end after it starts.", "warning");
      return;
    }
    if (Object.keys(draft.items).length === 0) {
      toast("Add at least one product to the sale.", "warning");
      return;
    }

    const body = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || null,
      starts_at: new Date(draft.startsAt).toISOString(),
      ends_at: new Date(draft.endsAt).toISOString(),
      is_active: draft.isActive,
      items: Object.entries(draft.items).map(([product_id, price]) => ({
        product_id,
        sale_price: price.trim() ? Number(price) : null,
      })),
    };

    setLoading(true);
    try {
      const res = await clientApi(
        draft.id ? `/admin/flash-sales/${draft.id}` : `/admin/flash-sales`,
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Could not save the sale.",
          "error"
        );
        return;
      }
      const saved: FlashSale = await res.json();
      setSales((current) =>
        draft.id ? current.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...current]
      );
      setDraft(null);
      toast(draft.id ? "Sale updated." : "Sale created.", "success");
    } catch {
      toast("Network error — nothing was saved.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleLive = async (sale: FlashSale) => {
    const turningOn = !sale.is_active;
    if (turningOn) {
      const ok = await confirm({
        title: "Put this sale live?",
        message: `"${sale.title}" becomes visible to every shopper as soon as its start time passes, at the prices set here.`,
        confirmLabel: "Go live",
      });
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await clientApi(`/admin/flash-sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: turningOn }),
      });
      if (!res.ok) throw new Error("Failed");
      const saved: FlashSale = await res.json();
      setSales((current) => current.map((s) => (s.id === saved.id ? saved : s)));
      toast(turningOn ? "Sale is active." : "Sale paused.", "success");
    } catch {
      toast("Could not change that.", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (sale: FlashSale) => {
    const ok = await confirm({
      title: "Delete this sale?",
      message: `"${sale.title}" and its ${sale.items.length} product${sale.items.length === 1 ? "" : "s"} will be removed. Products themselves are untouched.`,
      confirmLabel: "Delete sale",
      destructive: true,
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/flash-sales/${sale.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed");
      setSales((current) => current.filter((s) => s.id !== sale.id));
      toast("Sale deleted.", "success");
    } catch {
      toast("Could not delete that sale.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (id: string) =>
    setDraft((d) => {
      if (!d) return d;
      const items = { ...d.items };
      if (id in items) delete items[id];
      else items[id] = "";
      return { ...d, items };
    });

  const liveCount = sales.filter((s) => s.is_live).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Flash Sales"
        icon={<Timer className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description={
          liveCount > 0
            ? `${liveCount} sale${liveCount === 1 ? "" : "s"} running right now.`
            : "Schedule a time-boxed sale and choose what goes in it."
        }
        action={
          <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
            New sale
          </Button>
        }
      />

      <DataView
        items={sales}
        keyOf={(sale) => sale.id}
        empty={
          <EmptyState
            icon={<Timer className="h-10 w-10" />}
            title="No flash sales yet"
            message="Create one to control what the app's flash-sale screen shows and when."
            action={
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                New sale
              </Button>
            }
          />
        }
        columns={[
          {
            header: "Sale",
            cell: (sale) => (
              <div className="min-w-0">
                <p className="font-inter text-sm font-semibold text-ink">{sale.title}</p>
                {sale.subtitle && (
                  <p className="truncate font-open-sans text-xs text-ink-muted">
                    {sale.subtitle}
                  </p>
                )}
              </div>
            ),
          },
          {
            header: "Window",
            hideBelow: "lg",
            cell: (sale) => (
              <div className="whitespace-nowrap font-open-sans text-xs text-ink-soft">
                <div>{formatDateTime(sale.starts_at)}</div>
                <div className="text-ink-muted">→ {formatDateTime(sale.ends_at)}</div>
              </div>
            ),
          },
          {
            header: "Products",
            cell: (sale) => (
              <span className="font-inter text-sm font-semibold text-ink">
                {sale.items.length}
              </span>
            ),
          },
          {
            header: "Status",
            cell: (sale) => {
              const status = statusOf(sale);
              return <Badge tone={status.tone}>{status.label}</Badge>;
            },
          },
          {
            header: "Actions",
            align: "right",
            cell: (sale) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label={sale.is_active ? `Pause ${sale.title}` : `Activate ${sale.title}`}
                  tone={sale.is_active ? "warning" : "success"}
                  disabled={loading}
                  onClick={() => toggleLive(sale)}
                  icon={sale.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                />
                <IconButton
                  label={`Edit ${sale.title}`}
                  tone="primary"
                  disabled={loading}
                  onClick={() => openEdit(sale)}
                  icon={<Pencil className="h-4 w-4" />}
                />
                <IconButton
                  label={`Delete ${sale.title}`}
                  tone="danger"
                  disabled={loading}
                  onClick={() => remove(sale)}
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </div>
            ),
          },
        ]}
        card={(sale) => {
          const status = statusOf(sale);
          return (
            <DataCard accent={sale.is_live ? "success" : undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-inter text-sm font-semibold text-ink">{sale.title}</p>
                  {sale.subtitle && (
                    <p className="truncate font-open-sans text-xs text-ink-muted">
                      {sale.subtitle}
                    </p>
                  )}
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <CardField label="Starts" value={formatDateTime(sale.starts_at)} />
                <CardField label="Ends" value={formatDateTime(sale.ends_at)} />
                <CardField label="Products" value={sale.items.length} />
              </div>

              <CardActions>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => toggleLive(sale)}
                  icon={sale.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                >
                  {sale.is_active ? "Pause" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => openEdit(sale)}
                  icon={<Pencil className="h-4 w-4" />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => remove(sale)}
                  icon={<Trash2 className="h-4 w-4" />}
                  className="text-error hover:bg-error-ghost"
                >
                  Delete
                </Button>
              </CardActions>
            </DataCard>
          );
        }}
      />

      {/* ── Create / edit ── */}
      <Sheet
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit sale" : "New flash sale"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} className="sm:w-auto" block>
              Cancel
            </Button>
            <Button onClick={save} disabled={loading} className="sm:w-auto" block>
              {loading ? "Saving…" : draft?.id ? "Save changes" : "Create sale"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Title">
              <TextInput
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Weekend Flash Sale"
              />
            </Field>

            <Field label="Subtitle" hint="Optional line under the title in the app.">
              <TextInput
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                placeholder="Up to 50% off, this weekend only"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts">
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                  className="h-12 w-full rounded-xl border-[1.5px] border-surface-muted bg-surface-soft px-4 font-open-sans text-sm text-ink focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Ends">
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
                  className="h-12 w-full rounded-xl border-[1.5px] border-surface-muted bg-surface-soft px-4 font-open-sans text-sm text-ink focus:border-primary focus:outline-none"
                />
              </Field>
            </div>

            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-surface-muted p-3">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                className="h-5 w-5 flex-shrink-0 accent-[var(--color-primary)]"
              />
              <span className="font-open-sans text-sm text-ink-soft">
                <strong className="font-semibold text-ink">Active.</strong> The sale still
                only shows once its start time passes.
              </span>
            </label>

            <div className="rounded-xl border border-surface-muted p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-inter text-sm font-semibold text-ink">
                  {Object.keys(draft.items).length} product
                  {Object.keys(draft.items).length === 1 ? "" : "s"} in this sale
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  icon={<Package className="h-4 w-4" />}
                >
                  Choose products
                </Button>
              </div>

              {Object.keys(draft.items).length > 0 && (
                <ul className="mt-3 space-y-2">
                  {Object.entries(draft.items).map(([id, price]) => {
                    const product = productsById.get(id);
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-2 rounded-lg border border-surface-muted p-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-inter text-sm font-semibold text-ink">
                            {product?.name ?? id}
                          </span>
                          {product && (
                            <span className="block font-open-sans text-xs text-ink-muted">
                              normally <LocaleNumber value={product.actual_price} currency />
                            </span>
                          )}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={price}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              items: { ...draft.items, [id]: e.target.value },
                            })
                          }
                          placeholder="Sale price"
                          aria-label={`Sale price for ${product?.name ?? id}`}
                          className="h-10 w-28 rounded-lg border border-surface-muted bg-surface px-2 text-right font-mono text-sm text-ink focus:border-primary focus:outline-none"
                        />
                        <IconButton
                          label={`Remove ${product?.name ?? id}`}
                          tone="danger"
                          onClick={() => toggleProduct(id)}
                          icon={<X className="h-4 w-4" />}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-2 font-open-sans text-xs text-ink-muted">
                Leave a price blank to use whatever discount the product already has.
              </p>
            </div>
          </div>
        )}
      </Sheet>

      {/* ── Product picker ── */}
      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose products"
        description={`${Object.keys(draft?.items ?? {}).length} selected`}
        size="lg"
        footer={
          <Button onClick={() => setPickerOpen(false)} className="sm:w-auto" block>
            Done
          </Button>
        }
      >
        <div className="space-y-3">
          <SearchInput
            value={pickerSearch}
            onChange={setPickerSearch}
            placeholder="Search products…"
          />
          {filteredProducts.length === 0 ? (
            <p className="py-8 text-center font-open-sans text-sm text-ink-muted">
              No products match.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filteredProducts.map((product) => {
                const selected = draft ? product.id in draft.items : false;
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary-border bg-primary-ghost"
                          : "border-surface-muted bg-surface hover:bg-surface-soft"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-[1.5px]",
                          selected
                            ? "border-primary bg-primary text-ink"
                            : "border-surface-deep bg-surface"
                        )}
                        aria-hidden="true"
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-inter text-sm font-semibold text-ink">
                          {product.name}
                        </span>
                        <span className="block font-open-sans text-xs text-ink-muted">
                          <LocaleNumber value={product.actual_price} currency />
                        </span>
                      </span>
                      {!product.is_active && <Badge tone="error">Disabled</Badge>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Sheet>
    </div>
  );
}
