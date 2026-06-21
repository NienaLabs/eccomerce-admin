import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ShieldAlert } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { apiFetch, type AdminUser } from "@/lib/api";

export default async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Fetch the current user to verify role
  let user: AdminUser | null = null;
  try {
    const res = await apiFetch("/auth/me", token);

    if (res.ok) {
      user = (await res.json()) as AdminUser;
    }
  } catch {
    user = null;
  }

  // Check if user is an admin
  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4 py-12 sm:px-6 lg:px-8 font-open-sans">
        <ShieldAlert className="h-16 w-16 text-error mb-4" />
        <h1 className="text-3xl font-bold font-inter text-ink">Access Denied</h1>
        <p className="mt-2 text-ink-soft max-w-md text-center text-sm">
          You are logged in as <strong>{user?.email || "Unknown"}</strong> with
          role <strong>{user?.role || "user"}</strong>. Only administrators can
          access this dashboard.
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-8 rounded-lg bg-ink px-6 py-2.5 font-bold text-surface hover:bg-ink-soft transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return <DashboardLayout adminEmail={user.email}>{children}</DashboardLayout>;
}
