import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type AdminProduct } from "@/lib/api";
import { ProductsClient } from "./ProductsClient";

export const metadata = { title: "Products | AdminHub" };

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const products = await fetchList<AdminProduct>("/admin/products", token);

  return <ProductsClient initialProducts={products} />;
}
