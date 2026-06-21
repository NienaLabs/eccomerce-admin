"use client";

import { useState } from "react";
import { Send, Users, Store, Globe, Clock, Megaphone } from "lucide-react";
import { API_BASE_URL, type SystemBroadcast } from "@/lib/api";

export function BroadcastsClient({ initialBroadcasts, token }: { initialBroadcasts: SystemBroadcast[]; token: string }) {
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>(initialBroadcasts);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    if (!confirm(`Are you sure you want to send this push notification to ${targetAudience.toUpperCase()} users?`)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/broadcasts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, target_audience: targetAudience }),
      });
      if (!res.ok) throw new Error("Failed to send broadcast");
      
      const newBroadcast = await res.json();
      setBroadcasts([newBroadcast, ...broadcasts]);
      setTitle("");
      setMessage("");
    } catch {
      alert("Error sending broadcast");
    } finally {
      setLoading(false);
    }
  };

  const getAudienceIcon = (audience: string) => {
    if (audience === "vendors") return <Store className="w-4 h-4 mr-1" />;
    if (audience === "users") return <Users className="w-4 h-4 mr-1" />;
    return <Globe className="w-4 h-4 mr-1" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
          <Megaphone className="w-8 h-8 mr-3 text-primary" />
          Push Notifications
        </h1>
        <p className="text-ink-soft mt-1">
          Send global broadcast messages directly to users&apos; devices.
        </p>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-muted bg-surface-soft">
          <h2 className="text-xl font-bold font-inter text-ink">Compose Broadcast</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSend} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full sm:w-1/2 border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink font-bold"
              >
                <option value="all">Everyone (All Apps)</option>
                <option value="users">Buyers Only</option>
                <option value="vendors">Vendors Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Notification Title</label>
              <input 
                type="text" 
                required
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice"
                className="w-full border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink"
              />
              <p className="text-xs text-ink-muted mt-1">{title.length}/60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Message Body</label>
              <textarea 
                required
                maxLength={200}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the push notification message..."
                className="w-full border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink resize-none"
              />
              <p className="text-xs text-ink-muted mt-1">{message.length}/200 characters</p>
            </div>
            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading || !title || !message}
                className="px-6 py-3 bg-primary text-surface rounded-md font-bold hover:bg-primary-dim transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 mr-2" />
                {loading ? "Sending..." : "Send Now"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-inter flex items-center">
          <Clock className="w-5 h-5 mr-2 text-ink-muted" /> Broadcast History
        </h2>
        <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-muted">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Audience</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Title / Message</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Sent By</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-muted">
                {broadcasts.length > 0 ? broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-soft/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft font-mono">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-surface-muted text-ink-soft">
                        {getAudienceIcon(b.target_audience)}
                        {b.target_audience}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-bold text-ink mb-1">{b.title}</div>
                      <div className="text-ink-soft max-w-md truncate">{b.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ink-muted">
                      {b.admin_id || "System"}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">No broadcasts sent yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
