import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SystemBroadcast, type AdminUser } from "@/lib/api";
import { BroadcastsClient } from "./BroadcastsClient";

export const metadata = { title: "Notifications | AdminHub" };

export default async function BroadcastsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  // The recipient picker needs accounts to choose from, so both come down together.
  const [broadcasts, users] = await Promise.all([
    fetchList<SystemBroadcast>("/admin/broadcasts", token),
    fetchList<AdminUser>("/admin/users", token),
  ]);

  return <BroadcastsClient initialBroadcasts={broadcasts} users={users} />;
}
