import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, apiFetch, type SystemAuditLog, type DatabaseHealth } from "@/lib/api";
import { HealthClient } from "./HealthClient";

async function getHealthAndAudit(token: string) {
  try {
    const healthRes = await apiFetch("/admin/health", token);
    const health: DatabaseHealth = await healthRes.json();
    
    const logs = await fetchList<SystemAuditLog>("/admin/audit", token);
    
    return { health, logs };
  } catch (e) {
    console.error(e);
    return { health: null, logs: [] };
  }
}

export default async function HealthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const { health, logs } = await getHealthAndAudit(token);

  return (
    <div className="max-w-7xl mx-auto">
      <HealthClient initialHealth={health} initialLogs={logs} />
    </div>
  );
}
