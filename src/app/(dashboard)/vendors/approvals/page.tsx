import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type VendorApplication } from "@/lib/api";
import { ApprovalsClient } from "./ApprovalsClient";

export const metadata = { title: "Approvals | AdminHub" };

export default async function ApprovalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const apps = await fetchList<VendorApplication>("/admin/vendors/applications", token);

  return <ApprovalsClient initialApps={apps} />;
}
