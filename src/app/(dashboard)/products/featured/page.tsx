import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type AdminProduct } from "@/lib/api";
import { ProductsClient } from "../ProductsClient";

async function getProducts(token: string) {
  return fetchList<AdminProduct>("/admin/products", token);
}

export default async function FeaturedProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const products = await getProducts(token);
  // Filter for featured products
  const featuredProducts = products.filter(p => p.is_featured);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
          Featured Listings
        </h1>
        <p className="text-ink-soft mt-1">
          Review all currently featured products across the marketplace.
        </p>
      </div>
      <ProductsClient initialProducts={featuredProducts} token={token} />
    </div>
  );
}
