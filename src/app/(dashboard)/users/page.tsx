import { UsersClient } from "./UsersClient";
import { cookies } from "next/headers";
import { fetchList, type AdminUser } from "@/lib/api";

async function getUsers(token: string) {
  return fetchList<AdminUser>("/admin/users", token);
}

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value || "";
  const users = await getUsers(token);
  return <UsersClient initialUsers={users} token={token} />;
}
