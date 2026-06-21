"use client";

import { useState } from "react";
import { Package, Eye, Edit3, Trash2, Tag, ShieldCheck, Search, Filter } from "lucide-react";
import { API_BASE_URL, type AdminProduct } from "@/lib/api";

export function ProductsClient({ initialProducts, token }: { initialProducts: AdminProduct[]; token: string }) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const handleToggleActive = async (product: AdminProduct) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      
      const updated = await res.json();
      setProducts(products.map(p => p.id === product.id ? updated : p));
    } catch {
      alert("Error updating product status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (product: AdminProduct) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_featured: !product.is_featured }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      
      const updated = await res.json();
      setProducts(products.map(p => p.id === product.id ? updated : p));
    } catch {
      alert("Error updating product featured status");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePriceOverride = async () => {
    if (!editingProduct) return;
    
    try {
      setLoading(true);
      const overrideVal = priceOverride ? parseFloat(priceOverride) : null;
      const res = await fetch(`${API_BASE_URL}/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ admin_price_override: overrideVal }),
      });
      if (!res.ok) throw new Error("Failed to update product price");
      
      const updated = await res.json();
      setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      setEditingProduct(null);
    } catch {
      alert("Error updating product price");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else alert("Failed to delete product.");
    } catch {
      alert("Network Error: Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && product.is_active) || 
                          (statusFilter === "disabled" && !product.is_active);
    const matchesStock = stockFilter === "all" || 
                         (stockFilter === "in_stock" && product.stock_quantity > 0) || 
                         (stockFilter === "out_of_stock" && product.stock_quantity === 0);
    return matchesSearch && matchesStatus && matchesStock;
  });


  return (
    <div className="space-y-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-inter tracking-tight text-ink">
            Product Catalog
          </h1>
          <p className="text-ink-soft mt-1">
            Manage all products on the platform, set featured items, and override vendor pricing.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search products by name..."
            className="w-full pl-10 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-ghost" />
            <select
              className="w-full pl-9 pr-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="relative w-full sm:w-40">
            <select
              className="w-full px-4 py-2 bg-surface-soft border border-surface-muted rounded-lg focus:outline-none focus:border-primary text-ink appearance-none"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-muted">
            <thead className="bg-surface-soft">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Pricing</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Inventory</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-surface-muted">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-surface-soft/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center text-ink-muted border border-surface-deep">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-ink font-inter max-w-[200px] truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-ink-soft font-mono truncate max-w-[200px]">
                          Vendor: {product.vendor_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${product.admin_price_override ? 'line-through text-ink-muted' : 'text-ink'}`}>
                        ${product.actual_price.toFixed(2)}
                      </span>
                      {product.admin_price_override && (
                        <span className="text-sm font-bold text-primary flex items-center">
                          <Tag className="w-3 h-3 mr-1" /> ${product.admin_price_override.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${product.stock_quantity <= 5 ? 'text-error' : 'text-ink-soft'}`}>
                      {product.stock_quantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                    <div className="flex flex-col gap-2">
                      <button 
                        disabled={loading}
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase w-max cursor-pointer hover:opacity-80 transition-opacity ${product.is_active ? 'bg-success-ghost text-success' : 'bg-error-ghost text-error'}`}
                      >
                        {product.is_active ? 'Active' : 'Disabled'}
                      </button>
                      <button 
                        disabled={loading}
                        onClick={() => handleToggleFeatured(product)}
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase w-max cursor-pointer hover:opacity-80 transition-opacity ${product.is_featured ? 'bg-primary-ghost text-primary' : 'bg-surface-muted text-ink-muted'}`}
                      >
                        {product.is_featured ? 'Featured' : 'Not Featured'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3 items-center h-full">
                    <a href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:8081"}/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="text-info hover:text-info/80 font-bold p-2">
                      <Eye className="w-4 h-4" />
                    </a>
                    <button onClick={() => {
                      setEditingProduct(product);
                      setPriceOverride(product.admin_price_override ? product.admin_price_override.toString() : "");
                    }} className="text-primary hover:text-primary-dim font-bold p-2">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      disabled={loading}
                      onClick={() => handleDelete(product.id)}
                      className="text-error hover:text-error/80 font-bold p-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-ink-muted">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-surface-muted">
              <h2 className="text-xl font-bold font-inter">Override Product Price</h2>
              <p className="text-sm text-ink-soft mt-1">Set an admin price to override the vendor&apos;s listing price.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-1">New Price (USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Leave empty to remove override"
                  className="w-full border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink placeholder:text-ink-muted"
                />
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button 
                  disabled={loading}
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-ink-soft hover:text-ink font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  onClick={handleSavePriceOverride}
                  className="px-4 py-2 bg-primary text-surface rounded-md font-bold hover:bg-primary-dim transition-colors flex items-center"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Save Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
