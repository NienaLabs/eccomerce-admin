"use client";

/**
 * Hero banner manager — the flash-sale slideshow on the app's home screen.
 *
 * The banner table and the app's rendering of it already existed, but nothing
 * could write to it, so the slideshow only ever showed whatever had been
 * inserted by hand. This is the missing control surface.
 */

import { useState, useRef } from "react";
import { Images, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink, Upload, Loader2 } from "lucide-react";
import { clientApi, type HeroBanner } from "@/lib/api";
import { uploadImage } from "@/lib/upload";

export function HeroBannersClient({
  initialBanners,
}: {
  initialBanners: HeroBanner[];
}) {
  const [banners, setBanners] = useState<HeroBanner[]>(initialBanners);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = {
    "Content-Type": "application/json",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sortBanners = (list: HeroBanner[]) =>
    [...list].sort((a, b) => a.display_order - b.display_order);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setError(null);
    setLoading(true);
    try {
      const res = await clientApi(`/admin/hero-banners`, {
        method: "POST",
        headers: authHeaders,
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
      if (!res.ok) throw new Error(`Failed to add banner (${res.status})`);

      const created: HeroBanner = await res.json();
      setBanners(sortBanners([...banners, created]));
      setImageUrl("");
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add banner");
    } finally {
      setLoading(false);
    }
  };

  const patchBanner = async (id: string, changes: Partial<HeroBanner>) => {
    setError(null);
    // Optimistic: the list is small and a failure rolls back below.
    const previous = banners;
    setBanners(sortBanners(banners.map(b => (b.id === id ? { ...b, ...changes } : b))));
    try {
      const res = await clientApi(`/admin/hero-banners/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(`Failed to update banner (${res.status})`);
    } catch (err) {
      setBanners(previous);
      setError(err instanceof Error ? err.message : "Could not update banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this banner from the app's home screen?")) return;
    setError(null);
    const previous = banners;
    setBanners(banners.filter(b => b.id !== id));
    try {
      const res = await clientApi(`/admin/hero-banners/${id}`, {
        method: "DELETE",
              });
      if (!res.ok && res.status !== 204) throw new Error(`Failed to delete banner (${res.status})`);
    } catch (err) {
      setBanners(previous);
      setError(err instanceof Error ? err.message : "Could not delete banner");
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

  const activeCount = banners.filter(b => b.is_active).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
          <Images className="w-8 h-8 mr-3 text-primary" />
          Hero Banners
        </h1>
        <p className="mt-2 text-ink-muted">
          Flash-sale images shown in the slideshow at the top of the app&apos;s home screen.
          {" "}
          {activeCount} of {banners.length} live.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Add ── */}
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-surface-muted bg-surface p-6 space-y-4 shadow-sm"
      >
        <h2 className="font-semibold text-ink flex items-center">
          <Plus className="w-4 h-4 mr-2 text-primary" />
          Add a banner
        </h2>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Banner image <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          {imageUrl ? (
            <div className="relative w-full overflow-hidden rounded-lg border border-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Banner preview" className="h-40 w-full object-cover bg-surface-muted" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2 rounded-lg bg-ink/80 px-3 py-1.5 text-xs font-semibold text-surface backdrop-blur hover:bg-ink"
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-muted bg-surface-soft text-ink-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-sm font-medium">Click to upload an image</span>
                  <span className="text-xs">JPG, PNG, WEBP or GIF · landscape (16:9) works best</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Flash Sale"
              className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Subtitle</label>
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="Up to 50% off, today only"
              className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">Link</label>
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="/flash-sales"
            className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm text-ink"
          />
          <p className="mt-1 text-xs text-ink-muted">Where tapping the banner takes the shopper.</p>
        </div>

        <button
          type="submit"
          disabled={loading || uploading || !imageUrl.trim()}
          className="w-full sm:w-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add banner"}
        </button>
      </form>

      {/* ── Existing ── */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-muted p-12 text-center">
            <Images className="mx-auto mb-3 h-10 w-10 text-ink-muted" />
            <p className="font-medium text-ink">No banners yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              The app hides the slideshow entirely until you add one.
            </p>
          </div>
        ) : (
          banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-surface-muted bg-surface p-4 shadow-sm ${
                banner.is_active ? "" : "opacity-60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image_url}
                alt={banner.title ?? "Hero banner"}
                className="h-40 w-full sm:h-20 sm:w-36 flex-shrink-0 rounded-lg object-cover bg-surface-muted"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{banner.title || "Untitled banner"}</p>
                {banner.subtitle && (
                  <p className="truncate text-sm text-ink-muted">{banner.subtitle}</p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                  <span>Position {index + 1}</span>
                  {banner.link_url && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <ExternalLink className="h-3 w-3" />
                      {banner.link_url}
                    </span>
                  )}
                  <span className={banner.is_active ? "text-green-600" : "text-ink-muted"}>
                    {banner.is_active ? "Live" : "Hidden"}
                  </span>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === banners.length - 1}
                  title="Move down"
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => patchBanner(banner.id, { is_active: !banner.is_active })}
                  title={banner.is_active ? "Hide from app" : "Show in app"}
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted"
                >
                  {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  title="Delete"
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
