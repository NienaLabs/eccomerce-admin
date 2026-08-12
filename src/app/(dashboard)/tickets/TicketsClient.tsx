"use client";

import { useState } from "react";
import { CheckCircle, MessageSquare, LifeBuoy, ArrowLeft, Send } from "lucide-react";
import { clientApi, type SupportTicket } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, SearchInput, Select } from "@/components/ui/Filters";
import { useFeedback } from "@/components/ui/Feedback";
import { formatDateTime, shortId, cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

const STATUS_TONE = {
  open: "error",
  pending: "warning",
  closed: "success",
} as const;

export function TicketsClient({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const { toast, confirm } = useFeedback();

  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/tickets/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: SupportTicket = await res.json();
      setTickets((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      setSelected(updated);
      setReply("");
    } catch {
      toast("Could not send that reply.", "error");
    } finally {
      setLoading(false);
    }
  };

  const closeTicket = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: "Mark this ticket resolved?",
      message: `"${selected.subject}" will be closed. The user can't reply on it afterwards.`,
      confirmLabel: "Mark resolved",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/tickets/${selected.id}/close`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const updated: SupportTicket = await res.json();
      setTickets((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      setSelected(updated);
      toast("Ticket closed.", "success");
    } catch {
      toast("Could not close that ticket.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter((ticket) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      ticket.subject?.toLowerCase().includes(query) ||
      ticket.id.toLowerCase().includes(query);
    const matchesStatus = status === "all" || ticket.status === status;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter((t) => t.status === "open").length;

  // Panes are sized against the viewport so the conversation scrolls inside
  // itself rather than pushing the whole page down.
  const paneHeight = "h-[calc(100dvh-19rem)] min-h-[340px] lg:h-[calc(100dvh-16rem)]";

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Support"
        icon={<LifeBuoy className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description={
          openCount > 0
            ? `${openCount} open ticket${openCount === 1 ? "" : "s"}.`
            : "User and vendor tickets."
        }
      />

      {/* Filters are irrelevant while reading one conversation on a phone. */}
      <div className={cn(selected && "hidden lg:block")}>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by subject or ticket ID…"
          />
          <Select
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            label="Status"
          />
        </FilterBar>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* ── Inbox ── */}
        <div
          className={cn(
            "flex-col overflow-hidden rounded-xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)] lg:w-1/3",
            paneHeight,
            // On mobile the list gives way to the conversation entirely.
            selected ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="flex-shrink-0 border-b border-surface-muted bg-surface-soft px-4 py-3">
            <h2 className="font-inter text-sm font-bold text-ink">
              Inbox ({filtered.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="p-6 text-center font-open-sans text-sm text-ink-muted">
                No tickets match.
              </p>
            ) : (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelected(ticket)}
                  className={cn(
                    "w-full border-b border-surface-muted border-l-[3px] p-4 text-left transition-colors hover:bg-surface-soft",
                    selected?.id === ticket.id
                      ? "border-l-primary bg-surface-soft"
                      : "border-l-transparent"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-ink-muted">
                      {shortId(ticket.id, 12)}
                    </span>
                    <Badge tone={STATUS_TONE[ticket.status] ?? "neutral"}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <h3 className="truncate font-inter text-sm font-semibold text-ink">
                    {ticket.subject}
                  </h3>
                  <p className="mt-0.5 truncate font-open-sans text-xs text-ink-muted">
                    {ticket.messages.length} message
                    {ticket.messages.length === 1 ? "" : "s"} · {formatDateTime(ticket.updated_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Conversation ── */}
        <div
          className={cn(
            "flex-col overflow-hidden rounded-xl border border-surface-muted bg-surface shadow-[var(--shadow-raised-1)] lg:w-2/3",
            paneHeight,
            selected ? "flex" : "hidden lg:flex"
          )}
        >
          {selected ? (
            <>
              <div className="flex flex-shrink-0 items-start gap-3 border-b border-surface-muted bg-surface-soft p-3 sm:p-4">
                <IconButton
                  label="Back to inbox"
                  onClick={() => setSelected(null)}
                  icon={<ArrowLeft className="h-5 w-5" />}
                  className="lg:hidden"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-inter text-base font-bold text-ink">
                    {selected.subject}
                  </h2>
                  <p className="truncate font-mono text-xs text-ink-muted">
                    {shortId(selected.user_id, 16)}
                  </p>
                </div>
                {selected.status !== "closed" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={closeTicket}
                    disabled={loading}
                    icon={<CheckCircle className="h-4 w-4 text-success" />}
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Mark resolved</span>
                    <span className="sm:hidden">Resolve</span>
                  </Button>
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
                {selected.messages.length === 0 ? (
                  <p className="py-8 text-center font-open-sans text-sm text-ink-muted">
                    No messages on this ticket yet.
                  </p>
                ) : (
                  selected.messages.map((msg) => {
                    const fromAdmin = msg.sender_id !== selected.user_id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex", fromAdmin ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[75%]",
                            fromAdmin
                              ? "rounded-br-sm bg-ink text-surface"
                              : "rounded-bl-sm border border-surface-deep bg-surface-soft text-ink"
                          )}
                        >
                          <p className="font-open-sans text-sm leading-relaxed">
                            {msg.text}
                          </p>
                          <span
                            className={cn(
                              "mt-1.5 block font-open-sans text-[10px]",
                              fromAdmin ? "text-surface-deep" : "text-ink-muted"
                            )}
                          >
                            {formatDateTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selected.status !== "closed" ? (
                <form
                  onSubmit={sendReply}
                  className="flex flex-shrink-0 items-center gap-2 border-t border-surface-muted bg-surface-soft p-3"
                >
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a reply…"
                    aria-label="Reply to ticket"
                    className="h-11 min-w-0 flex-1 rounded-full border border-surface-deep bg-surface px-4 font-open-sans text-sm text-ink placeholder:text-ink-ghost focus:border-primary focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !reply.trim()}
                    aria-label="Send reply"
                    className="!min-h-11 flex-shrink-0 rounded-full px-4"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </form>
              ) : (
                <p className="flex-shrink-0 border-t border-surface-muted bg-surface-soft p-4 text-center font-inter text-sm font-semibold text-ink-muted">
                  This ticket is closed.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={<MessageSquare className="h-10 w-10" />}
              title="Select a ticket"
              message="Pick a conversation from the inbox to read and reply to it."
              className="m-auto border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
