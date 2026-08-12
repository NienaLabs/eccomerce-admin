"use client";

import { useState } from "react";
import { Tag, Plus, Trash2, Pencil } from "lucide-react";
import { clientApi } from "@/lib/api";
import type { Category } from "./page";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput, Select } from "@/components/ui/Filters";
import { DataView, DataCard, CardActions } from "@/components/ui/DataView";
import { useFeedback } from "@/components/ui/Feedback";

const CATEGORY_ENUMS = [
  "electronics",
  "fashion",
  "home_living",
  "beauty_health",
  "sports_outdoors",
  "books_media",
  "food_groceries",
  "toys_games",
  "automotive",
  "other",
];

const formatEnum = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const { toast, confirm } = useFeedback();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  // `null` = closed, "new" = creating, a Category = editing that one.
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryEnum, setCategoryEnum] = useState("other");
  // Editing an existing slug changes storefront URLs, so it's opt-in rather
  // than silently regenerated from the name the way it is when creating.
  const [slugTouched, setSlugTouched] = useState(false);

  const isEdit = editing !== null && editing !== "new";

  const openCreate = () => {
    setName("");
    setSlug("");
    setCategoryEnum("other");
    setSlugTouched(false);
    setEditing("new");
  };

  const openEdit = (category: Category) => {
    setName(category.name);
    setSlug(category.slug);
    setCategoryEnum(category.category_enum);
    setSlugTouched(true);
    setEditing(category);
  };

  const save = async () => {
    if (!name.trim() || !slug.trim()) {
      toast("A name and slug are both required.", "warning");
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      category_enum: categoryEnum,
    };

    setLoading(true);
    try {
      const target = isEdit ? `/categories/${(editing as Category).id}` : `/categories/`;
      const res = await clientApi(target, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string"
            ? detail.detail
            : isEdit
              ? "Could not save the changes."
              : "Could not create it.",
          "error"
        );
        return;
      }

      const saved: Category = await res.json();
      setCategories((current) =>
        isEdit
          ? current.map((c) => (c.id === saved.id ? saved : c))
          : [...current, saved]
      );
      setEditing(null);
      toast(isEdit ? `"${saved.name}" updated.` : `"${saved.name}" added.`, "success");
    } catch {
      toast("Network error — nothing was saved.", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (category: Category) => {
    const count = category.product_count ?? 0;
    const ok = await confirm({
      title: "Delete this category?",
      message:
        count > 0
          ? `"${category.name}" still has ${count} product${count === 1 ? "" : "s"} filed under it. They keep their listings but lose this grouping, and shoppers will no longer find them by browsing this category.`
          : `"${category.name}" is empty, so nothing will be unfiled. This can't be undone.`,
      confirmLabel: count > 0 ? `Delete anyway (${count} product${count === 1 ? "" : "s"})` : "Delete category",
      destructive: true,
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/categories/${category.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setCategories(categories.filter((c) => c.id !== category.id));
      toast("Category deleted.", "success");
    } catch {
      toast("Could not delete the category.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Categories"
        icon={<Tag className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="The category structure shoppers browse by."
        action={
          <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
            Add category
          </Button>
        }
      />

      <DataView
        items={categories}
        keyOf={(category) => category.id}
        empty={
          <EmptyState
            icon={<Tag className="h-10 w-10" />}
            title="No categories yet"
            message="Add one so shoppers have something to browse by."
            action={
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                Add category
              </Button>
            }
          />
        }
        columns={[
          {
            header: "Name",
            cell: (category) => (
              <span className="font-inter text-sm font-semibold text-ink">
                {category.name}
              </span>
            ),
          },
          {
            header: "Slug",
            cell: (category) => (
              <span className="font-mono text-sm text-ink-muted">/{category.slug}</span>
            ),
          },
          {
            header: "Group",
            cell: (category) => (
              <Badge tone="neutral">{formatEnum(category.category_enum)}</Badge>
            ),
          },
          {
            header: "Products",
            cell: (category) => (
              <span
                className={`font-inter text-sm font-semibold ${
                  (category.product_count ?? 0) > 0 ? "text-ink" : "text-ink-muted"
                }`}
              >
                {category.product_count ?? "—"}
              </span>
            ),
          },
          {
            header: "Actions",
            align: "right",
            cell: (category) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label={`Edit ${category.name}`}
                  tone="primary"
                  disabled={loading}
                  onClick={() => openEdit(category)}
                  icon={<Pencil className="h-4 w-4" />}
                />
                <IconButton
                  label={`Delete ${category.name}`}
                  tone="danger"
                  disabled={loading}
                  onClick={() => remove(category)}
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </div>
            ),
          },
        ]}
        card={(category) => (
          <DataCard>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-inter text-sm font-semibold text-ink">{category.name}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                  /{category.slug}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <Badge tone="neutral">{formatEnum(category.category_enum)}</Badge>
                <span className="font-open-sans text-xs text-ink-muted">
                  {category.product_count ?? 0} product
                  {(category.product_count ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <CardActions>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => openEdit(category)}
                icon={<Pencil className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => remove(category)}
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
        title={isEdit ? "Edit category" : "Add category"}
        description={isEdit ? (editing as Category).name : undefined}
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
            <Button onClick={save} disabled={loading} className="sm:w-auto" block>
              {loading
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <TextInput
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Only auto-derive the slug while the admin hasn't taken it
                // over — silently rewriting an existing slug would break every
                // storefront link pointing at this category.
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Smart Watches"
            />
          </Field>

          <Field
            label="Slug"
            hint={
              isEdit
                ? "Changing this breaks existing links to the category."
                : "Used in the storefront URL."
            }
          >
            <TextInput
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="smart-watches"
              className="font-mono"
            />
          </Field>

          <Field
            label="System group"
            hint="Which built-in group this category rolls up to."
          >
            <Select
              value={categoryEnum}
              onChange={setCategoryEnum}
              label="System group"
              className="w-full sm:w-full"
              options={CATEGORY_ENUMS.map((value) => ({
                value,
                label: formatEnum(value),
              }))}
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
