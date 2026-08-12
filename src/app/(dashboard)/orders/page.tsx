import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchJson, type AdminOrderPage } from "@/lib/api";
import { OrdersClient } from "./OrdersClient";

export const metadata = { title: "Orders | AdminHub" };

const EMPTY: AdminOrderPage = { items: [], total: 0, skip: 0, limit: 50 };

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const page = await fetchJson<AdminOrderPage>("/admin/orders?limit=50", token, EMPTY);

  return <OrdersClient initialPage={page} />;
}
