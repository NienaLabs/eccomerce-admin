import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList } from "@/lib/api";
import { CategoriesClient } from "./CategoriesClient";

export const metadata = { title: "Categories | AdminHub" };

export interface Category {
  id: string;
  name: string;
  slug: string;
  category_enum: string;
  parent_id?: string;
  created_at: string;
  /** How many products sit in this category — drives the delete warning. */
  product_count?: number | null;
}

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const categories = await fetchList<Category>("/categories/");

  return <CategoriesClient initialCategories={categories} />;
}
