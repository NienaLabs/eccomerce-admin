import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type Vendor } from "@/lib/api";
import { VendorsClient } from "./VendorsClient";
import { CardListSkeleton } from "@/components/ui/Skeleton";

export const metadata = { title: "Vendors | AdminHub" };

export default async function VendorsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const vendors = await fetchList<Vendor>("/admin/vendors", token);

  return (
    // The client reads `?flagged=` via useSearchParams, which Next requires to
    // sit inside a Suspense boundary.
    <Suspense fallback={<CardListSkeleton />}>
      <VendorsClient initialVendors={vendors} />
    </Suspense>
  );
}
