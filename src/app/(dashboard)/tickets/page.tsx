import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList, type SupportTicket } from "@/lib/api";
import { TicketsClient } from "./TicketsClient";

async function getTickets(token: string) {
  return fetchList<SupportTicket>("/admin/tickets", token);
}

export default async function TicketsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const tickets = await getTickets(token);

  return <TicketsClient initialTickets={tickets} token={token} />;
}
