"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Users, Megaphone, LifeBuoy, ShieldAlert, X, ClipboardCheck, Settings, Activity, Banknote, Images, Package, Tag, Star, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Product Categories", href: "/products/categories", icon: Tag },
  { name: "Featured Listings", href: "/products/featured", icon: Star },
  { name: "Low Stock Alerts", href: "/products/inventory", icon: AlertTriangle },
  { name: "System Health & Audit", href: "/health", icon: Activity },
  { name: "Global App Settings", href: "/settings", icon: Settings },
  { name: "Push Notifications", href: "/broadcasts", icon: Megaphone },
  { name: "Hero Banners", href: "/hero-banners", icon: Images },
  { name: "Commissions", href: "/commissions", icon: Banknote },
  { name: "Support Tickets", href: "/tickets", icon: LifeBuoy },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Vendor Management", href: "/vendors", icon: Store },
  { name: "Vendor Approvals", href: "/vendors/approvals", icon: ClipboardCheck },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col bg-surface border-r border-surface-muted shadow-sm">
      <div className="flex h-20 items-center justify-between px-6 border-b border-surface-muted">
        <div className="flex items-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-primary mr-3">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold font-inter text-ink">
            AdminHub
          </span>
        </div>
        {onClose && (
          <button 
            type="button" 
            className="lg:hidden p-2 -mr-2 text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose} // close sidebar on mobile after navigating
              className={cn(
                "group flex items-center border-l-4 px-4 py-3 text-sm font-semibold rounded-r-lg transition-colors",
                isActive
                  ? "border-primary bg-primary-ghost text-ink"
                  : "border-transparent text-ink-soft hover:bg-surface-soft hover:text-ink"
              )}
            >
              <Icon
                className={cn(
                  "mr-4 flex-shrink-0 h-5 w-5",
                  isActive ? "text-ink" : "text-ink-muted group-hover:text-ink"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
