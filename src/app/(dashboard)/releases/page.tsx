import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SystemSetting } from "@/lib/api";
import { ReleasesClient } from "./ReleasesClient";

export const metadata = { title: "Releases | AdminHub" };

export default async function ReleasesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const settings = await fetchList<SystemSetting>("/admin/settings", token);

  return <ReleasesClient initialSettings={settings} />;
}
