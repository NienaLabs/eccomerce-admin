import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchJson, fetchList, type SystemAuditLog, type DatabaseHealth } from "@/lib/api";
import { HealthClient } from "./HealthClient";

export const metadata = { title: "Health & Audit | AdminHub" };

export default async function HealthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const [health, logs] = await Promise.all([
    fetchJson<DatabaseHealth | null>("/admin/health", token, null),
    fetchList<SystemAuditLog>("/admin/audit", token),
  ]);

  return <HealthClient initialHealth={health} initialLogs={logs} />;
}
