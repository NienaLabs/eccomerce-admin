import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SystemSetting } from "@/lib/api";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings | AdminHub" };

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const settings = await fetchList<SystemSetting>("/admin/settings", token);

  return <SettingsClient initialSettings={settings} />;
}
