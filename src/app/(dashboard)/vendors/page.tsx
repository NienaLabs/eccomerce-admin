import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SystemSetting, type Vendor } from "@/lib/api";
import { VendorsClient } from "./VendorsClient";
import { CardListSkeleton } from "@/components/ui/Skeleton";

export const metadata = { title: "Vendors | AdminHub" };

export default async function VendorsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  // Both are needed to say anything true about assistant access: enabling a
  // vendor grants nothing while the platform-wide switch is off, and an admin
  // toggling rows with no idea the master switch is closed would reasonably
  // conclude the feature is broken.
  const [vendors, settings] = await Promise.all([
    fetchList<Vendor>("/admin/vendors", token),
    fetchList<SystemSetting>("/admin/settings", token),
  ]);

  const assistantPlatformEnabled =
    settings.find((s) => s.key === "ai_assistant_enabled")?.value === "true";

  return (
    // The client reads `?flagged=` via useSearchParams, which Next requires to
    // sit inside a Suspense boundary.
    <Suspense fallback={<CardListSkeleton />}>
      <VendorsClient
        initialVendors={vendors}
        assistantPlatformEnabled={assistantPlatformEnabled}
      />
    </Suspense>
  );
}
