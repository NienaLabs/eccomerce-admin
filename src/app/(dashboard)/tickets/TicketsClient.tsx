"use client";

import { useState } from "react";
import { CheckCircle, MessageSquare, Search, Filter } from "lucide-react";
import { API_BASE_URL, type SupportTicket } from "@/lib/api";

export function TicketsClient({ initialTickets, token }: { initialTickets: SupportTicket[]; token: string }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: replyText }),
      });
      
      if (res.ok) {
        const updatedTicket = await res.json();
        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
        setReplyText("");
      } else {
        alert("Failed to send reply");
      }
    } catch {
      alert("Network error while sending reply");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/tickets/${selectedTicket.id}/close`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (res.ok) {
        const updatedTicket = await res.json();
        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
      } else {
        alert("Failed to close ticket");
      }
    } catch {
      alert("Network error while closing ticket");
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.id.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
          Support Tickets
        </h1>
        <p className="text-ink-soft mt-1">
          Manage user inquiries, bug reports, and vendor assistance requests.
        </p>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center mb-6 flex-shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search tickets by subject or ID..."
            className="w-full pl-10 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-ghost" />
          <select
            className="w-full pl-9 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
        {/* Tickets List */}
        <div className="w-full lg:w-1/3 flex flex-col bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden min-h-[300px] lg:min-h-0">
          <div className="p-4 border-b border-surface-muted bg-surface-soft">
            <h2 className="font-bold font-inter">Inbox</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full text-left p-4 border-b border-surface-muted hover:bg-surface-soft transition-colors ${selectedTicket?.id === ticket.id ? 'bg-surface-soft border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-ink-muted">{ticket.id.substring(0, 12)}...</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    ticket.status === 'open' ? 'bg-error-ghost text-error' :
                    ticket.status === 'pending' ? 'bg-warning-ghost text-warning' :
                    'bg-success-ghost text-success'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <h3 className="font-bold font-inter text-sm truncate text-ink">{ticket.subject}</h3>
                <p className="text-xs text-ink-soft mt-1 truncate">User ID: {ticket.user_id.substring(0, 8)}</p>
              </button>
            )) : (
              <div className="p-4 text-center text-ink-muted">No tickets found.</div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="w-full lg:w-2/3 flex flex-col bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden min-h-[400px] lg:min-h-0">
          {selectedTicket ? (
            <>
              <div className="p-6 border-b border-surface-muted bg-surface-soft flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold font-inter">{selectedTicket.subject}</h2>
                  <p className="text-sm text-ink-soft mt-1">User ID: <span className="font-bold font-mono">{selectedTicket.user_id}</span></p>
                </div>
                {selectedTicket.status !== "closed" && (
                  <button 
                    disabled={loading}
                    onClick={handleCloseTicket} 
                    className="inline-flex items-center px-4 py-2 bg-surface-deep text-ink text-sm font-bold rounded-md hover:bg-surface-muted transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                    Mark Resolved
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id !== selectedTicket.user_id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      msg.sender_id !== selectedTicket.user_id 
                        ? 'bg-ink text-surface rounded-br-none' 
                        : 'bg-surface-soft border border-surface-deep text-ink rounded-bl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className={`text-[10px] block mt-2 ${msg.sender_id !== selectedTicket.user_id ? 'text-surface-deep' : 'text-ink-muted'}`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTicket.status !== "closed" ? (
                <div className="p-4 border-t border-surface-muted bg-surface-soft">
                  <form onSubmit={handleReply} className="flex gap-4">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 rounded-full border border-surface-deep bg-surface px-5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-ink"
                    />
                    <button disabled={loading || !replyText.trim()} type="submit" className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-ink hover:bg-primary-dim transition-colors disabled:opacity-50">
                      Send
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-surface-muted bg-surface-soft text-center text-sm font-bold text-ink-muted">
                  This ticket has been closed.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-ink-muted">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
