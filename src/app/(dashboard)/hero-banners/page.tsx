import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type HeroBanner } from "@/lib/api";
import { HeroBannersClient } from "./HeroBannersClient";

async function getBanners(token: string) {
  // The admin feed includes inactive banners; the public one does not.
  return fetchList<HeroBanner>("/admin/hero-banners", token);
}

export default async function HeroBannersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const banners = await getBanners(token);

  return (
    <div className="max-w-7xl mx-auto">
      <HeroBannersClient initialBanners={banners} />
    </div>
  );
}
