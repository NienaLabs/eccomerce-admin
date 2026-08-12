import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type AdminUser } from "@/lib/api";
import { UsersClient } from "./UsersClient";

export const metadata = { title: "Users | AdminHub" };

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const users = await fetchList<AdminUser>("/admin/users", token);

  return <UsersClient initialUsers={users} />;
}
