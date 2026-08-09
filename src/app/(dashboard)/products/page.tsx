import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type AdminProduct } from "@/lib/api";
import { ProductsClient } from "./ProductsClient";

async function getProducts(token: string) {
  return fetchList<AdminProduct>("/admin/products", token);
}

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const products = await getProducts(token);

  return (
    <div className="max-w-7xl mx-auto">
      <ProductsClient initialProducts={products} />
    </div>
  );
}
