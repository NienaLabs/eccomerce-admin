import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { fetchList, type AdminProduct } from "@/lib/api";
import { ProductsClient } from "../ProductsClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Featured | AdminHub" };

export default async function FeaturedProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const products = await fetchList<AdminProduct>("/admin/products", token);
  const featured = products.filter((p) => p.is_featured);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Featured"
        icon={<Star className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description={`${featured.length} promoted listing${featured.length === 1 ? "" : "s"} across the marketplace.`}
      />
      {/* The shared client renders its own header on /products; this page has
          already drawn one, so it's suppressed to avoid the double title the
          previous version shipped. */}
      <ProductsClient initialProducts={featured} showHeader={false} />
    </div>
  );
}
