"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Shield,
  Ban,
  CheckCircle,
  Plus,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { clientApi, type AdminUser } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, SearchInput, Select, Field, TextInput } from "@/components/ui/Filters";
import { DataView, DataCard, CardActions } from "@/components/ui/DataView";
import { useFeedback } from "@/components/ui/Feedback";
import { shortId } from "@/lib/utils";

const ROLES = [
  {
    id: "admin",
    title: "Administrator",
    desc: "Full access to platform settings and management.",
  },
  { id: "vendor", title: "Vendor", desc: "Can manage a storefront, products and orders." },
  { id: "user", title: "Shopper", desc: "Can browse, buy and leave reviews." },
];

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Shopper" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export function UsersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();

  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "" });

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendPermanent, setSuspendPermanent] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const label = (user: AdminUser) => user.name || user.email || shortId(user.id);

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    setLoading(true);
    try {
      const res = await clientApi(`/admin/users/${suspendTarget.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: suspendReason.trim() || "Suspended by admin",
          is_permanent: suspendPermanent,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((current) =>
        current.map((u) =>
          u.id === suspendTarget.id ? { ...u, is_suspended: true } : u
        )
      );
      toast(`${label(suspendTarget)} suspended.`, "success");
      router.refresh();
    } catch {
      toast("Could not suspend that account.", "error");
    } finally {
      setLoading(false);
      setSuspendTarget(null);
      setSuspendReason("");
      setSuspendPermanent(false);
    }
  };

  const unsuspend = async (user: AdminUser) => {
    setLoading(true);
    try {
      const res = await clientApi(`/admin/users/${user.id}/unsuspend`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setUsers((current) =>
        current.map((u) => (u.id === user.id ? { ...u, is_suspended: false } : u))
      );
      toast(`${label(user)} reactivated.`, "success");
      router.refresh();
    } catch {
      toast("Could not reactivate that account.", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (user: AdminUser) => {
    const ok = await confirm({
      title: "Delete this account?",
      message: `${label(user)} will be deleted permanently, along with their vendor profile and products if they have any. This cannot be undone.`,
      confirmLabel: "Delete account",
      destructive: true,
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await clientApi(`/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setUsers((current) => current.filter((u) => u.id !== user.id));
      toast("Account deleted.", "success");
      router.refresh();
    } catch {
      toast("Could not delete that account.", "error");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (role: string) => {
    if (!roleTarget) return;
    setLoading(true);
    try {
      const res = await clientApi(`/admin/users/${roleTarget.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((current) =>
        current.map((u) => (u.id === roleTarget.id ? { ...u, role } : u))
      );
      toast(`${label(roleTarget)} is now ${role}.`, "success");
      router.refresh();
    } catch {
      toast("Could not change that role.", "error");
    } finally {
      setLoading(false);
      setRoleTarget(null);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await clientApi(`/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Could not create the account.",
          "error"
        );
        return;
      }
      const created: AdminUser = await res.json();
      setUsers([...users, created]);
      setAdding(false);
      setNewUser({ email: "", password: "", name: "" });
      toast("Account created.", "success");
      router.refresh();
    } catch {
      toast("Network error — the account was not created.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((user) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query);
    const matchesRole =
      roleFilter === "all" ||
      user.role === roleFilter ||
      (!user.role && roleFilter === "user");
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "suspended" && user.is_suspended) ||
      (statusFilter === "active" && !user.is_suspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Users"
        icon={<UsersIcon className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Accounts, roles and suspensions."
        action={
          <Button onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />}>
            Add user
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email…"
        />
        <Select value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} label="Role" />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          label="Status"
        />
      </FilterBar>

      <DataView
        items={filtered}
        keyOf={(user) => user.id}
        empty={
          <EmptyState
            icon={<UsersIcon className="h-10 w-10" />}
            title="No accounts match"
            message="Try clearing the search or filters."
          />
        }
        columns={[
          {
            header: "User",
            cell: (user) => (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                  <UserCircle className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-inter text-sm font-semibold text-ink">
                    {user.name || "—"}
                  </p>
                  <p className="truncate font-open-sans text-xs text-ink-soft">
                    {user.email}
                  </p>
                  <p className="font-mono text-xs text-ink-ghost">{shortId(user.id)}</p>
                </div>
              </div>
            ),
          },
          {
            header: "Role & status",
            cell: (user) => (
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="neutral">{user.role || "user"}</Badge>
                <Badge tone={user.is_suspended ? "error" : "success"}>
                  {user.is_suspended ? "Suspended" : "Active"}
                </Badge>
              </div>
            ),
          },
          {
            header: "Actions",
            align: "right",
            cell: (user) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label={`Change role for ${label(user)}`}
                  tone="info"
                  disabled={loading}
                  onClick={() => setRoleTarget(user)}
                  icon={<Shield className="h-4 w-4" />}
                />
                {user.is_suspended ? (
                  <IconButton
                    label={`Reactivate ${label(user)}`}
                    tone="success"
                    disabled={loading}
                    onClick={() => unsuspend(user)}
                    icon={<CheckCircle className="h-4 w-4" />}
                  />
                ) : (
                  <IconButton
                    label={`Suspend ${label(user)}`}
                    tone="warning"
                    disabled={loading}
                    onClick={() => setSuspendTarget(user)}
                    icon={<Ban className="h-4 w-4" />}
                  />
                )}
                <IconButton
                  label={`Delete ${label(user)}`}
                  tone="danger"
                  disabled={loading}
                  onClick={() => remove(user)}
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </div>
            ),
          },
        ]}
        card={(user) => (
          <DataCard accent={user.is_suspended ? "error" : undefined}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                <UserCircle className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-inter text-sm font-semibold text-ink">
                  {user.name || "Unnamed account"}
                </p>
                <p className="truncate font-open-sans text-xs text-ink-soft">
                  {user.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{user.role || "user"}</Badge>
                  <Badge tone={user.is_suspended ? "error" : "success"}>
                    {user.is_suspended ? "Suspended" : "Active"}
                  </Badge>
                </div>
              </div>
            </div>

            <CardActions>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => setRoleTarget(user)}
                icon={<Shield className="h-4 w-4" />}
              >
                Role
              </Button>
              {user.is_suspended ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => unsuspend(user)}
                  icon={<CheckCircle className="h-4 w-4" />}
                  className="text-success hover:bg-success-ghost"
                >
                  Reactivate
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => setSuspendTarget(user)}
                  icon={<Ban className="h-4 w-4" />}
                  className="text-warning hover:bg-warning-ghost"
                >
                  Suspend
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => remove(user)}
                icon={<Trash2 className="h-4 w-4" />}
                className="text-error hover:bg-error-ghost"
              >
                Delete
              </Button>
            </CardActions>
          </DataCard>
        )}
      />

      {/* ── Create account ── */}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Register a new account"
        size="sm"
      >
        <form onSubmit={addUser} className="space-y-4">
          <Field label="Email address">
            <TextInput
              required
              type="email"
              autoComplete="off"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="person@example.com"
            />
          </Field>

          <Field label="Full name">
            <TextInput
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Ama Mensah"
            />
          </Field>

          <Field
            label="Temporary password"
            hint="Share it over a trusted channel and have them change it at first sign-in."
          >
            <TextInput
              required
              type="password"
              autoComplete="new-password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAdding(false)}
              className="sm:w-auto"
              block
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="sm:w-auto" block>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* ── Change role ── */}
      <Sheet
        open={roleTarget !== null}
        onClose={() => setRoleTarget(null)}
        title="Change role"
        description={roleTarget ? label(roleTarget) : undefined}
        size="sm"
      >
        <div className="space-y-3">
          {ROLES.map((role) => {
            const current = (roleTarget?.role || "user") === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => changeRole(role.id)}
                disabled={loading || current}
                className="w-full rounded-xl border border-surface-muted p-4 text-left transition-colors hover:border-primary-border hover:bg-surface-soft disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-inter font-semibold text-ink">{role.title}</h3>
                  {current ? (
                    <Badge tone="primary">Current</Badge>
                  ) : (
                    <Shield
                      className={`h-4 w-4 ${role.id === "admin" ? "text-ink" : "text-ink-muted"}`}
                    />
                  )}
                </div>
                <p className="mt-1 font-open-sans text-sm text-ink-soft">{role.desc}</p>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* ── Suspend ── */}
      <Sheet
        open={suspendTarget !== null}
        onClose={() => setSuspendTarget(null)}
        title={suspendTarget ? `Suspend ${label(suspendTarget)}` : ""}
        tone="danger"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSuspendTarget(null)}
              className="sm:w-auto"
              block
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
              disabled={loading}
              className="sm:w-auto"
              block
            >
              {loading ? "Suspending…" : "Confirm suspension"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason" hint="Stored on the suspension record.">
            <TextInput
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Repeated violation of terms"
            />
          </Field>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-surface-muted p-3">
            <input
              type="checkbox"
              checked={suspendPermanent}
              onChange={(e) => setSuspendPermanent(e.target.checked)}
              className="h-5 w-5 flex-shrink-0 accent-[var(--color-error)]"
            />
            <span className="font-open-sans text-sm text-ink-soft">
              <strong className="font-semibold text-ink">Permanent ban.</strong> The
              account can never be reactivated.
            </span>
          </label>
        </div>
      </Sheet>
    </div>
  );
}
