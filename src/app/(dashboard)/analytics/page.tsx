import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchJson, type PlatformOverview } from "@/lib/api";
import { AnalyticsClient } from "./AnalyticsClient";

export const metadata = { title: "Analytics | AdminHub" };

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const overview = await fetchJson<PlatformOverview | null>(
    "/analytics/admin/overview",
    token,
    null
  );

  return <AnalyticsClient overview={overview} />;
}
