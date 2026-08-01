import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { CommissionsClient } from "./CommissionsClient";

async function getCommissions(token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/commissions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/** The platform-wide commission rate, from the same setting the vendor app reads. */
async function getGlobalCommissionRate(token: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return 5;
    const settings: { key: string; value: string }[] = await res.json();
    const rate = parseFloat(settings.find(s => s.key === "platform_commission")?.value ?? "5");
    return isNaN(rate) ? 5 : rate;
  } catch {
    return 5;
  }
}

export default async function CommissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const [commissions, globalRate] = await Promise.all([
    getCommissions(token),
    getGlobalCommissionRate(token),
  ]);

  return <CommissionsClient initialData={commissions} initialGlobalRate={globalRate} token={token} />;
}
