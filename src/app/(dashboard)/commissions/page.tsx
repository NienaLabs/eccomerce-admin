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

export default async function CommissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const commissions = await getCommissions(token);

  return <CommissionsClient initialData={commissions} token={token} />;
}
