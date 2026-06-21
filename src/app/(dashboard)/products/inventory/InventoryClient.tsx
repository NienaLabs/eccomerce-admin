"use client";

import { AlertTriangle, Package, ExternalLink } from "lucide-react";
import { type AdminProduct } from "@/lib/api";
import Link from "next/link";

export function InventoryClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const zeroStock = initialProducts.filter(p => p.stock_quantity === 0);
  const lowStock = initialProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
          <AlertTriangle className="w-8 h-8 mr-3 text-warning" />
          Inventory Alerts
        </h1>
        <p className="text-ink-soft mt-1">
          Review products that are out of stock or running low.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface rounded-xl p-6 border border-error shadow-sm">
          <div className="text-error font-bold text-lg mb-2">Out of Stock</div>
          <div className="text-4xl font-inter font-black text-ink">{zeroStock.length}</div>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-warning shadow-sm">
          <div className="text-warning font-bold text-lg mb-2">Low Stock (≤ 5)</div>
          <div className="text-4xl font-inter font-black text-ink">{lowStock.length}</div>
        </div>
      </div>

      <div className="bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-muted">
            <thead className="bg-surface-soft">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Stock Level</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider font-inter">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-surface-muted">
              {initialProducts.length > 0 ? initialProducts.map((product) => (
                <tr key={product.id} className="hover:bg-surface-soft/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center text-ink-muted border border-surface-deep">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-ink font-inter max-w-[250px] truncate">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-muted font-mono truncate max-w-[150px]">
                    {product.vendor_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${product.stock_quantity === 0 ? 'bg-error-ghost text-error' : 'bg-warning-ghost text-warning'}`}>
                      {product.stock_quantity === 0 ? 'Out of Stock' : `${product.stock_quantity} Left`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href="/products" className="text-primary hover:text-primary-dim font-bold inline-flex items-center">
                      Manage <ExternalLink className="w-4 h-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">No low stock alerts.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
