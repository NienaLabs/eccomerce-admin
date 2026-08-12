"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Send,
  Users,
  Store,
  Globe,
  Clock,
  Megaphone,
  UserPlus,
  X,
  Check,
  Target,
} from "lucide-react";
import { clientApi, type SystemBroadcast, type AdminUser } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput, TextArea, Select, SearchInput } from "@/components/ui/Filters";
import { DataView, DataCard, CardField } from "@/components/ui/DataView";
import { useFeedback } from "@/components/ui/Feedback";
import { formatDateTime, cn } from "@/lib/utils";

const AUDIENCES = [
  { value: "all", label: "Everyone (all apps)" },
  { value: "users", label: "Shoppers only" },
  { value: "vendors", label: "Vendors only" },
  { value: "specific", label: "Specific people…" },
];

function audienceIcon(audience: string) {
  if (audience === "vendors") return <Store className="h-3 w-3" />;
  if (audience === "users") return <Users className="h-3 w-3" />;
  if (audience === "specific") return <Target className="h-3 w-3" />;
  return <Globe className="h-3 w-3" />;
}

function audienceLabel(broadcast: SystemBroadcast) {
  if (broadcast.target_audience !== "specific") return broadcast.target_audience;
  const count = broadcast.target_user_ids?.length ?? 0;
  return `${count} recipient${count === 1 ? "" : "s"}`;
}

export function BroadcastsClient({
  initialBroadcasts,
  users,
}: {
  initialBroadcasts: SystemBroadcast[];
  users: AdminUser[];
}) {
  const { toast, confirm } = useFeedback();

  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>(initialBroadcasts);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");

  // ── Targeted send ────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  // Whole records, not just ids: a selected account often isn't in the current
  // result set, and the chips still have to show who it is.
  const [selected, setSelected] = useState<AdminUser[]>([]);
  const [results, setResults] = useState<AdminUser[]>(users);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const selectedIds = useMemo(() => selected.map((u) => u.id), [selected]);

  /**
   * Search runs on the server. Filtering client-side only ever saw the first
   * page of accounts, so anyone outside it was unreachable no matter what you
   * typed.
   */
  useEffect(() => {
    if (!pickerOpen) return;

    // Debounced, and the state updates land in the timer callback rather than
    // synchronously in the effect body.
    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({ limit: "50" });
        const term = pickerSearch.trim();
        if (term) params.set("search", term);

        const res = await clientApi(`/admin/users?${params}`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setResults(await res.json());
      } catch {
        setResults([]);
        setSearchError("Couldn't reach the server. Check the backend and retry.");
      } finally {
        setSearching(false);
      }
    }, pickerSearch ? 300 : 0);

    return () => clearTimeout(handle);
  }, [pickerOpen, pickerSearch]);

  const toggleRecipient = (user: AdminUser) => {
    setSelected((current) =>
      current.some((u) => u.id === user.id)
        ? current.filter((u) => u.id !== user.id)
        : [...current, user]
    );
  };

  const describeUser = (user: AdminUser) => user.name || user.email || user.id;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (audience === "specific" && selectedIds.length === 0) {
      toast("Pick at least one recipient first.", "warning");
      return;
    }

    const who =
      audience === "specific"
        ? `${selectedIds.length} selected ${selectedIds.length === 1 ? "person" : "people"}`
        : audience === "all"
          ? "everyone on the platform"
          : audience === "vendors"
            ? "every vendor"
            : "every shopper";

    const ok = await confirm({
      title: "Send this notification?",
      message: `"${title.trim()}" will be pushed to ${who}. Push notifications cannot be recalled once sent.`,
      confirmLabel: "Send now",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          target_audience: audience,
          user_ids: audience === "specific" ? selectedIds : null,
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Failed to send.",
          "error"
        );
        return;
      }

      const created: SystemBroadcast = await res.json();
      setBroadcasts([created, ...broadcasts]);
      setTitle("");
      setMessage("");
      setSelected([]);
      setAudience("all");
      toast("Notification queued for delivery.", "success");
    } catch {
      toast("Network error — nothing was sent.", "error");
    } finally {
      setLoading(false);
    }
  };

  const canSend =
    Boolean(title.trim()) &&
    Boolean(message.trim()) &&
    (audience !== "specific" || selectedIds.length > 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Notifications"
        icon={<Megaphone className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Push a message to the whole platform, one audience, or a hand-picked set of accounts."
      />

      <section className="overflow-hidden rounded-xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)]">
        <div className="border-b border-surface-muted bg-surface-soft px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-inter text-base font-bold text-ink">Compose</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4 p-4 sm:p-6">
          <div className="max-w-md">
            <Field label="Audience">
              <Select
                value={audience}
                onChange={setAudience}
                options={AUDIENCES}
                label="Target audience"
                className="w-full sm:w-full"
              />
            </Field>
          </div>

          {audience === "specific" && (
            <div className="rounded-xl border border-primary-border bg-primary-ghost p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-inter text-sm font-semibold text-ink">
                  {selectedIds.length === 0
                    ? "No recipients chosen"
                    : `${selectedIds.length} recipient${selectedIds.length === 1 ? "" : "s"}`}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  {selectedIds.length === 0 ? "Choose people" : "Edit selection"}
                </Button>
              </div>

              {selected.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-surface-muted bg-surface py-1 pl-3 pr-1 font-open-sans text-xs text-ink"
                    >
                      <span className="max-w-[160px] truncate">{describeUser(user)}</span>
                      <button
                        type="button"
                        onClick={() => toggleRecipient(user)}
                        aria-label={`Remove ${describeUser(user)}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="max-w-2xl space-y-4">
            <Field label="Title" hint={`${title.length}/60 characters`}>
              <TextInput
                required
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled maintenance tonight"
              />
            </Field>

            <Field label="Message" hint={`${message.length}/200 characters`}>
              <TextArea
                required
                maxLength={200}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What should the notification say?"
              />
            </Field>
          </div>

          <Button
            type="submit"
            disabled={loading || !canSend}
            icon={<Send className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            {loading ? "Sending…" : "Send now"}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-inter text-base font-bold text-ink sm:text-lg">
          <Clock className="h-4 w-4 text-ink-muted" /> History
        </h2>

        <DataView
          items={broadcasts}
          keyOf={(b) => b.id}
          empty={
            <EmptyState
              icon={<Megaphone className="h-10 w-10" />}
              title="Nothing sent yet"
              message="Notifications you send will be listed here with their audience."
            />
          }
          columns={[
            {
              header: "Sent",
              cell: (b) => (
                <span className="whitespace-nowrap font-open-sans text-sm text-ink-soft">
                  {formatDateTime(b.created_at)}
                </span>
              ),
            },
            {
              header: "Audience",
              cell: (b) => (
                <Badge
                  tone={b.target_audience === "specific" ? "primary" : "neutral"}
                  icon={audienceIcon(b.target_audience)}
                >
                  {audienceLabel(b)}
                </Badge>
              ),
            },
            {
              header: "Message",
              cell: (b) => (
                <div className="min-w-0 max-w-md">
                  <p className="truncate font-inter text-sm font-semibold text-ink">
                    {b.title}
                  </p>
                  <p className="truncate font-open-sans text-xs text-ink-muted">
                    {b.message}
                  </p>
                </div>
              ),
            },
            {
              header: "Sent by",
              hideBelow: "lg",
              cell: (b) => (
                <span className="font-mono text-xs text-ink-muted">
                  {b.admin_id || "System"}
                </span>
              ),
            },
          ]}
          card={(b) => (
            <DataCard>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 font-inter text-sm font-semibold text-ink">
                  {b.title}
                </p>
                <Badge
                  tone={b.target_audience === "specific" ? "primary" : "neutral"}
                  icon={audienceIcon(b.target_audience)}
                >
                  {audienceLabel(b)}
                </Badge>
              </div>
              <p className="mt-1.5 font-open-sans text-sm text-ink-soft">{b.message}</p>
              <div className="mt-3 border-t border-surface-muted pt-2">
                <CardField label="Sent" value={formatDateTime(b.created_at)} />
              </div>
            </DataCard>
          )}
        />
      </section>

      {/* ── Recipient picker ── */}
      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose recipients"
        description={
          selected.length > 0
            ? `${selected.length} selected`
            : "Search the whole platform by name, email or ID"
        }
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setSelected([])}
              disabled={selected.length === 0}
              className="sm:w-auto"
              block
            >
              Clear all
            </Button>
            <Button onClick={() => setPickerOpen(false)} className="sm:w-auto" block>
              Done ({selected.length})
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <SearchInput
            value={pickerSearch}
            onChange={setPickerSearch}
            placeholder="Search by name, email or ID…"
          />

          {/* Keep selections visible even once they drop out of the results. */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-primary-border bg-primary-ghost p-2">
              {selected.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleRecipient(user)}
                  aria-label={`Remove ${describeUser(user)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-muted bg-surface py-1 pl-3 pr-2 font-open-sans text-xs text-ink transition-colors hover:border-error hover:text-error"
                >
                  <span className="max-w-[150px] truncate">{describeUser(user)}</span>
                  <X className="h-3 w-3 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {searchError ? (
            <div className="rounded-xl border border-error bg-error-ghost p-4 text-center">
              <p className="font-open-sans text-sm text-error">{searchError}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPickerSearch((s) => s)}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          ) : searching && results.length === 0 ? (
            <p className="py-8 text-center font-open-sans text-sm text-ink-muted">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center font-open-sans text-sm text-ink-muted">
              {pickerSearch.trim()
                ? "No accounts match that search."
                : "No accounts came back from the server."}
            </p>
          ) : (
            <>
              <ul className={cn("space-y-1.5", searching && "opacity-60")}>
                {results.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => toggleRecipient(user)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          isSelected
                            ? "border-primary-border bg-primary-ghost"
                            : "border-surface-muted bg-surface hover:bg-surface-soft"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-ink"
                              : "border-surface-deep bg-surface"
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-inter text-sm font-semibold text-ink">
                            {user.name || "Unnamed account"}
                          </span>
                          <span className="block truncate font-open-sans text-xs text-ink-muted">
                            {user.email}
                          </span>
                        </span>

                        {user.role && user.role !== "user" && (
                          <Badge tone="neutral">{user.role}</Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {results.length >= 50 && (
                <p className="pt-1 text-center font-open-sans text-xs text-ink-muted">
                  Showing the first 50 matches — narrow the search to find someone
                  specific.
                </p>
              )}
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}
