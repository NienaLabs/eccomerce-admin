"use client";

import { useState } from "react";
import { Search, Filter, UserCircle, Shield, Ban, CheckCircle, Plus, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, type AdminUser } from "@/lib/api";

export function UsersClient({ initialUsers, token }: { initialUsers: AdminUser[]; token: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isAdding, setIsAdding] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "" }); // name instead of username based on auth.py
  const [loading, setLoading] = useState(false);
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendPermanent, setSuspendPermanent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const ROLES = [
    { id: "admin", title: "Administrator", desc: "Full access to platform settings and management." },
    { id: "vendor", title: "Vendor", desc: "Can manage a storefront, products, and orders." },
    { id: "user", title: "Standard User", desc: "Can browse, buy, and leave reviews." },
  ];

  const confirmSuspend = async () => {
    if (!suspendModalUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/users/${suspendModalUser.id}/suspend`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: suspendReason || "Suspended by admin", is_permanent: suspendPermanent }),
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === suspendModalUser.id ? { ...u, is_suspended: true } : u));
        router.refresh();
      } else {
        alert("Backend failed to suspend user.");
      }
    } catch {
      alert("Network Error: Failed to suspend user.");
    } finally {
      setLoading(false);
      setSuspendModalUser(null);
      setSuspendReason("");
      setSuspendPermanent(false);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/unsuspend`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: false } : u));
        router.refresh();
      } else {
        alert("Backend failed to reactivate user.");
      }
    } catch {
      alert("Network Error: Failed to reactivate user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This will also delete their vendor profile and products if they have any.")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        router.refresh();
      } else {
        alert("Backend failed to delete user.");
      }
    } catch {
      alert("Network Error: Failed to delete user.");
    } finally {
      setLoading(false);
    }
  };

  const submitRoleChange = async (role: string) => {
    if (!roleModalUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/users/${roleModalUser}/role`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === roleModalUser ? { ...u, role } : u));
        router.refresh();
      } else {
        alert("Backend failed to update role.");
      }
    } catch {
      alert("Network Error: Failed to update role.");
    } finally {
      setLoading(false);
      setRoleModalUser(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const addedUser = (await res.json()) as AdminUser;
        setUsers([...users, addedUser]);
        setIsAdding(false);
        setNewUser({ email: "", password: "", name: "" });
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(`Failed to create user: ${errorData.detail || "Unknown error"}`);
      }
    } catch {
      alert("Network Error: Could not reach backend to register user.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter || (!user.role && roleFilter === "user");
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "suspended" && user.is_suspended) || 
                          (statusFilter === "active" && !user.is_suspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
            User Management
          </h1>
          <p className="text-ink-soft mt-1">
            Suspend accounts, change roles, and add new users securely.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-primary-dim transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add User
        </button>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-ghost" />
            <select
              className="w-full pl-9 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink appearance-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="relative w-full sm:w-40">
            <select
              className="w-full px-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-surface border border-surface-muted rounded-xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold font-inter">Register New User</h3>
            <button onClick={() => setIsAdding(false)} className="text-ink-muted hover:text-ink"><X className="h-5 w-5"/></button>
          </div>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              required
              type="email"
              placeholder="Email address"
              className="rounded-md border border-surface-deep bg-surface px-3 py-2 text-ink focus:border-primary focus:outline-none"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            />
            <input
              required
              type="text"
              placeholder="Full Name"
              className="rounded-md border border-surface-deep bg-surface px-3 py-2 text-ink focus:border-primary focus:outline-none"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Password"
              className="rounded-md border border-surface-deep bg-surface px-3 py-2 text-ink focus:border-primary focus:outline-none"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            />
            <div className="sm:col-span-3 flex justify-end gap-3 mt-2">
              <button disabled={loading} type="submit" className="px-6 py-2 bg-ink text-surface rounded-md text-sm font-bold hover:bg-ink-soft disabled:opacity-50">
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role Selection Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-surface-muted flex justify-between items-center bg-surface-soft">
              <div>
                <h2 className="text-xl font-bold font-inter">Change Role</h2>
                <p className="text-sm text-ink-soft">Select a new permission level</p>
              </div>
              <button onClick={() => setRoleModalUser(null)} className="text-ink-muted hover:text-ink"><X className="h-6 w-6"/></button>
            </div>
            <div className="p-6 space-y-4">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => submitRoleChange(role.id)}
                  disabled={loading}
                  className="w-full text-left p-4 border border-surface-deep rounded-xl hover:border-primary hover:bg-surface-soft transition-all focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-ink font-inter">{role.title}</h3>
                    <Shield className={`h-5 w-5 ${role.id === 'admin' ? 'text-primary' : 'text-ink-muted'}`} />
                  </div>
                  <p className="text-sm text-ink-soft mt-1">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModalUser && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-surface-muted flex justify-between items-center bg-error-ghost">
              <div>
                <h2 className="text-xl font-bold font-inter text-error flex items-center">
                  <Ban className="w-5 h-5 mr-2" /> Suspend {suspendModalUser.name || suspendModalUser.email}
                </h2>
              </div>
              <button onClick={() => setSuspendModalUser(null)} className="text-error/70 hover:text-error"><X className="h-6 w-6"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Reason for Suspension</label>
                <input 
                  type="text" 
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Violation of terms..."
                  className="w-full border-surface-muted rounded-md shadow-sm focus:border-error focus:ring-error text-ink"
                />
              </div>
              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  id="permanent"
                  checked={suspendPermanent}
                  onChange={(e) => setSuspendPermanent(e.target.checked)}
                  className="rounded border-surface-muted text-error focus:ring-error h-4 w-4"
                />
                <label htmlFor="permanent" className="ml-2 text-sm text-ink-soft">Permanent Ban (User will never be able to return)</label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setSuspendModalUser(null)} className="px-4 py-2 bg-surface-muted text-ink-muted rounded-md font-bold hover:bg-surface-deep">Cancel</button>
                <button 
                  onClick={confirmSuspend}
                  disabled={loading}
                  className="px-4 py-2 bg-error text-surface rounded-md font-bold hover:bg-error-dim disabled:opacity-50"
                >
                  {loading ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-muted">
            <thead className="bg-surface-soft">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Role & Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-surface-muted">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-soft/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted flex-shrink-0">
                        <UserCircle className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-ink font-inter">
                          {user.name || "—"}
                        </div>
                        <div className="text-xs text-ink-soft">{user.email}</div>
                        <div className="text-xs text-ink-ghost font-mono">ID: {user.id.substring(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-surface-deep text-ink">
                        {user.role || 'user'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${user.is_suspended ? 'bg-error-ghost text-error' : 'bg-success-ghost text-success'}`}>
                        {user.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button 
                        disabled={loading}
                        onClick={() => setRoleModalUser(user.id)} 
                        className="inline-flex items-center text-info hover:text-info/80 font-bold disabled:opacity-50"
                      >
                        <Shield className="w-4 h-4 mr-1" /> Role
                      </button>
                      {user.is_suspended ? (
                        <button 
                          disabled={loading}
                          onClick={() => handleUnsuspend(user.id)} 
                          className="inline-flex items-center text-success hover:text-success/80 font-bold disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1"/> Reactivate
                        </button>
                      ) : (
                        <button 
                          disabled={loading}
                          onClick={() => setSuspendModalUser(user)} 
                          className="inline-flex items-center text-error hover:text-error/80 font-bold disabled:opacity-50"
                        >
                          <Ban className="w-4 h-4 mr-1"/> Suspend
                        </button>
                      )}
                      <button 
                        disabled={loading}
                        onClick={() => handleDelete(user.id)} 
                        className="inline-flex items-center text-error hover:text-error/80 font-bold disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1"/> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
