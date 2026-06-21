"use client";

import { useState } from "react";
import { FolderTree, Plus, Trash2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import type { Category } from "./page";

export function CategoriesClient({ initialCategories, token }: { initialCategories: Category[]; token: string }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEnum, setNewEnum] = useState("other");

  const categoryEnums = [
    "electronics", "fashion", "home_living", "beauty_health", 
    "sports_outdoors", "books_media", "food_groceries", 
    "toys_games", "automotive", "other"
  ];

  const formatEnum = (val: string) =>
    val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleCreate = async () => {
    if (!newName || !newSlug) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/categories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newName, 
          slug: newSlug,
          category_enum: newEnum
        }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      
      const newCategory = await res.json();
      setCategories([...categories, newCategory]);
      setIsAdding(false);
      setNewName("");
      setNewSlug("");
    } catch {
      alert("Error creating category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete category");
      
      setCategories(categories.filter(c => c.id !== id));
    } catch {
      alert("Error deleting category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
            <FolderTree className="w-8 h-8 mr-3 text-primary" />
            Category Management
          </h1>
          <p className="text-ink-soft mt-1">
            Organize products by managing the platform&apos;s category structure.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-primary text-surface rounded-md font-bold hover:bg-primary-dim transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </button>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-muted">
            <thead className="bg-surface-soft">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Slug</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Enum Group</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-surface-muted">
              {categories.length > 0 ? categories.map((category) => (
                <tr key={category.id} className="hover:bg-surface-soft/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ink font-inter">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-muted font-mono">
                    /{category.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-surface-muted text-ink-soft">
                      {formatEnum(category.category_enum)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3 items-center">
                    <button 
                      disabled={loading}
                      onClick={() => handleDelete(category.id)}
                      className="text-error hover:text-error-dim font-bold p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-surface-muted flex justify-between items-center bg-surface-soft">
              <h2 className="text-xl font-bold font-inter">Add New Category</h2>
              <button onClick={() => setIsAdding(false)} className="text-ink-muted hover:text-ink"><X className="h-6 w-6"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  className="w-full border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink"
                  placeholder="e.g. Smart Watches"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Slug URL</label>
                <input 
                  type="text" 
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink font-mono text-sm"
                  placeholder="smart-watches"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1">System Enum Group</label>
                <select
                  value={newEnum}
                  onChange={(e) => setNewEnum(e.target.value)}
                  className="w-full border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink"
                >
                  {categoryEnums.map(e => <option key={e} value={e}>{formatEnum(e)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button 
                  disabled={loading}
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-ink-soft hover:text-ink font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  onClick={handleCreate}
                  className="px-4 py-2 bg-primary text-surface rounded-md font-bold hover:bg-primary-dim transition-colors"
                >
                  {loading ? "Creating..." : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
