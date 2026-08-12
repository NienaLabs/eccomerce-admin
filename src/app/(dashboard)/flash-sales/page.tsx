import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type FlashSale, type AdminProduct } from "@/lib/api";
import { FlashSalesClient } from "./FlashSalesClient";

export const metadata = { title: "Flash Sales | AdminHub" };

export default async function FlashSalesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  // The product picker needs something to choose from, so both come together.
  const [sales, products] = await Promise.all([
    fetchList<FlashSale>("/admin/flash-sales", token),
    fetchList<AdminProduct>("/admin/products", token),
  ]);

  return <FlashSalesClient initialSales={sales} products={products} />;
}
