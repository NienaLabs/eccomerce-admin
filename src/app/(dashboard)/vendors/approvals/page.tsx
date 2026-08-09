import { ApprovalsClient } from "./ApprovalsClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type VendorApplication } from "@/lib/api";

async function getApplications(token: string) {
  return fetchList<VendorApplication>("/admin/vendors/applications", token);
}

export default async function ApprovalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const apps = await getApplications(token);
  return (
    <div className="max-w-7xl mx-auto">
      <ApprovalsClient initialApps={apps} />
    </div>
  );
}
