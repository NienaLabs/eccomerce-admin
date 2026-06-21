import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type AdminProduct } from "@/lib/api";
import { InventoryClient } from "./InventoryClient";

async function getProducts(token: string) {
  return fetchList<AdminProduct>("/admin/products", token);
}

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const products = await getProducts(token);
  // Filter for low stock or zero stock
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5);

  return (
    <div className="max-w-7xl mx-auto">
      <InventoryClient initialProducts={lowStockProducts} />
    </div>
  );
}
