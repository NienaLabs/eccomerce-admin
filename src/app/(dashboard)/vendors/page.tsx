import { VendorsClient } from "./VendorsClient";
import { cookies } from "next/headers";
import { fetchList, type Vendor } from "@/lib/api";

async function getVendors(token: string) {
  return fetchList<Vendor>("/admin/vendors", token);
}

export default async function VendorsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value || "";
  const vendors = await getVendors(token);
  return <VendorsClient initialVendors={vendors} />;
}
