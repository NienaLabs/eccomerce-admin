import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SystemSetting } from "@/lib/api";
import { SettingsClient } from "./SettingsClient";

async function getSettings(token: string) {
  return fetchList<SystemSetting>("/admin/settings", token);
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const settings = await getSettings(token);

  return (
    <div className="max-w-7xl mx-auto">
      <SettingsClient initialSettings={settings} token={token} />
    </div>
  );
}
