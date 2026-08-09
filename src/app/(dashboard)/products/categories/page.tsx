import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchList } from "@/lib/api";
import { CategoriesClient } from "./CategoriesClient";

export interface Category {
  id: string;
  name: string;
  slug: string;
  category_enum: string;
  parent_id?: string;
  created_at: string;
}

async function getCategories() {
  return fetchList<Category>("/categories/");
}

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
