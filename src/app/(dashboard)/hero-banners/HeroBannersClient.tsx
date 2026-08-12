"use client";

/**
 * Hero banner manager — the flash-sale slideshow on the app's home screen.
 *
 * The banner table and the app's rendering of it already existed, but nothing
 * could write to it, so the slideshow only ever showed whatever had been
 * inserted by hand. This is the missing control surface.
 */

import { useRef, useState } from "react";
import {
  Images,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";
import { clientApi, type HeroBanner } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput } from "@/components/ui/Filters";
import { useFeedback } from "@/components/ui/Feedback";

export function HeroBannersClient({
  initialBanners,
}: {
  initialBanners: HeroBanner[];
}) {
  const { toast, confirm } = useFeedback();

  const [banners, setBanners] = useState<HeroBanner[]>(initialBanners);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortBanners = (list: HeroBanner[]) =>
    [...list].sort((a, b) => a.display_order - b.display_order);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/hero-banners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl.trim(),
          title: title.trim() || null,
          subtitle: subtitle.trim() || null,
          link_url: linkUrl.trim() || null,
          // Append to the end of the slideshow.
          display_order: banners.length,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);

      const created: HeroBanner = await res.json();
      setBanners(sortBanners([...banners, created]));
      setImageUrl("");
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
      toast("Banner added to the slideshow.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not add the banner.", "error");
    } finally {
      setLoading(false);
    }
  };

  const patchBanner = async (id: string, changes: Partial<HeroBanner>) => {
    // Optimistic: the list is small and a failure rolls back below.
    const previous = banners;
    setBanners(sortBanners(banners.map((b) => (b.id === id ? { ...b, ...changes } : b))));
    try {
      const res = await clientApi(`/admin/hero-banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
    } catch (err) {
      setBanners(previous);
      toast(err instanceof Error ? err.message : "Could not update the banner.", "error");
    }
  };

  const remove = async (banner: HeroBanner) => {
    const ok = await confirm({
      title: "Remove this banner?",
      message: `"${banner.title || "Untitled banner"}" will be deleted from the home-screen slideshow.`,
      confirmLabel: "Remove banner",
      destructive: true,
    });
    if (!ok) return;

    const previous = banners;
    setBanners(banners.filter((b) => b.id !== banner.id));
    try {
      const res = await clientApi(`/admin/hero-banners/${banner.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`Failed (${res.status})`);
      toast("Banner removed.", "success");
    } catch (err) {
      setBanners(previous);
      toast(err instanceof Error ? err.message : "Could not delete the banner.", "error");
    }
  };

  /** Swap display_order with the neighbour so the slideshow reorders. */
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const a = banners[index];
    const b = banners[target];
    patchBanner(a.id, { display_order: b.display_order });
    patchBanner(b.id, { display_order: a.display_order });
  };

  const activeCount = banners.filter((b) => b.is_active).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Hero Banners"
        icon={<Images className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description={`Slideshow at the top of the app's home screen. ${activeCount} of ${banners.length} live.`}
      />

      <form
        onSubmit={create}
        className="space-y-4 rounded-xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-1)] sm:p-6"
      >
        <h2 className="flex items-center gap-2 font-inter text-base font-bold text-ink">
          <Plus className="h-4 w-4 text-ink-muted" /> Add a banner
        </h2>

        <div>
          <label className="mb-1.5 block font-inter text-sm font-semibold text-ink">
            Banner image <span className="text-error">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Banner preview"
                className="h-40 w-full bg-surface-muted object-cover"
              />
              <Button
                type="button"
                size="sm"
                variant="dark"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2"
              >
                {uploading ? "Uploading…" : "Replace"}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-muted bg-surface-soft text-ink-muted transition-colors hover:border-primary hover:text-ink disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-inter text-sm font-semibold">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="font-inter text-sm font-semibold">
                    Tap to upload an image
                  </span>
                  <span className="px-4 text-center font-open-sans text-xs">
                    JPG, PNG, WEBP or GIF · landscape (16:9) works best
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Flash Sale"
            />
          </Field>
          <Field label="Subtitle">
            <TextInput
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Up to 50% off, today only"
            />
          </Field>
        </div>

        <Field label="Link" hint="Where tapping the banner takes the shopper.">
          <TextInput
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/flash-sales"
          />
        </Field>

        <Button
          type="submit"
          disabled={loading || uploading || !imageUrl.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? "Adding…" : "Add banner"}
        </Button>
      </form>

      {banners.length === 0 ? (
        <EmptyState
          icon={<Images className="h-10 w-10" />}
          title="No banners yet"
          message="The app hides the slideshow entirely until you add one."
        />
      ) : (
        <ul className="space-y-3">
          {banners.map((banner, index) => (
            <li
              key={banner.id}
              className={`overflow-hidden rounded-2xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)] ${
                banner.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image_url}
                  alt={banner.title ?? "Hero banner"}
                  className="h-36 w-full flex-shrink-0 rounded-xl bg-surface-muted object-cover sm:h-16 sm:w-28"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-inter text-sm font-semibold text-ink">
                      {banner.title || "Untitled banner"}
                    </p>
                    <Badge tone={banner.is_active ? "success" : "neutral"}>
                      {banner.is_active ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                  {banner.subtitle && (
                    <p className="truncate font-open-sans text-sm text-ink-muted">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-open-sans text-xs text-ink-muted">
                    <span>Position {index + 1}</span>
                    {banner.link_url && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{banner.link_url}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center justify-end gap-1 border-t border-surface-muted pt-2 sm:border-0 sm:pt-0">
                  <IconButton
                    label="Move up"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    icon={<ArrowUp className="h-4 w-4" />}
                  />
                  <IconButton
                    label="Move down"
                    onClick={() => move(index, 1)}
                    disabled={index === banners.length - 1}
                    icon={<ArrowDown className="h-4 w-4" />}
                  />
                  <IconButton
                    label={banner.is_active ? "Hide from app" : "Show in app"}
                    onClick={() => patchBanner(banner.id, { is_active: !banner.is_active })}
                    icon={
                      banner.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )
                    }
                  />
                  <IconButton
                    label="Delete banner"
                    tone="danger"
                    onClick={() => remove(banner)}
                    icon={<Trash2 className="h-4 w-4" />}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
