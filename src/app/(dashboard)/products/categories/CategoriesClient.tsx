"use client";

import { useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
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
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryEnum, setCategoryEnum] = useState("other");

  const reset = () => {
    setName("");
    setSlug("");
    setCategoryEnum("other");
  };

  const create = async () => {
    if (!name.trim() || !slug.trim()) {
      toast("A name and slug are both required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await clientApi(`/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          category_enum: categoryEnum,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Could not create it.",
          "error"
        );
        return;
      }
      const created: Category = await res.json();
      setCategories([...categories, created]);
      setAdding(false);
      reset();
      toast(`"${created.name}" added.`, "success");
    } catch {
      toast("Network error — the category was not created.", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (category: Category) => {
    const ok = await confirm({
      title: "Delete this category?",
      message: `"${category.name}" will be removed. Products filed under it keep their listing but lose this grouping.`,
      confirmLabel: "Delete category",
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
          <Button onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />}>
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
              <Button onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />}>
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
            header: "Actions",
            align: "right",
            cell: (category) => (
              <IconButton
                label={`Delete ${category.name}`}
                tone="danger"
                disabled={loading}
                onClick={() => remove(category)}
                icon={<Trash2 className="h-4 w-4" />}
              />
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
              <Badge tone="neutral">{formatEnum(category.category_enum)}</Badge>
            </div>
            <CardActions>
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
        open={adding}
        onClose={() => setAdding(false)}
        title="Add category"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAdding(false)}
              className="sm:w-auto"
              block
            >
              Cancel
            </Button>
            <Button onClick={create} disabled={loading} className="sm:w-auto" block>
              {loading ? "Creating…" : "Create category"}
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
                setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Smart Watches"
            />
          </Field>

          <Field label="Slug" hint="Used in the storefront URL.">
            <TextInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
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
