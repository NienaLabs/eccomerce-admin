import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SystemBroadcast } from "@/lib/api";
import { BroadcastsClient } from "./BroadcastsClient";

async function getBroadcasts(token: string) {
  return fetchList<SystemBroadcast>("/admin/broadcasts", token);
}

export default async function BroadcastsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const broadcasts = await getBroadcasts(token);

  return (
    <div className="max-w-7xl mx-auto">
      <BroadcastsClient initialBroadcasts={broadcasts} />
    </div>
  );
}
