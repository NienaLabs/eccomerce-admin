import {
  LayoutDashboard,
  Store,
  Users,
  Megaphone,
  LifeBuoy,
  ClipboardCheck,
  Settings,
  Activity,
  Banknote,
  Images,
  Package,
  Tag,
  Star,
  ChartNoAxesCombined,
  ReceiptText,
  Rocket,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  /** Short form for the bottom tab bar, where 10 characters is the ceiling. */
  shortName?: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for the sidebar, the mobile "More" sheet and the
 * bottom tab bar. Sixteen destinations in one flat list — which is what this
 * was — is unusable on a phone, so they're grouped by the job being done.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Insights",
    items: [
      {
        name: "Overview",
        href: "/",
        icon: LayoutDashboard,
        description: "Platform health at a glance",
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: ChartNoAxesCombined,
        description: "Revenue, orders and top vendors",
      },
      {
        name: "Orders",
        href: "/orders",
        icon: ReceiptText,
        description: "Every order on the platform",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        name: "Products",
        href: "/products",
        icon: Package,
        description: "Listings, pricing and visibility",
      },
      {
        name: "Categories",
        href: "/products/categories",
        icon: Tag,
        description: "Category structure",
      },
      {
        name: "Featured",
        href: "/products/featured",
        icon: Star,
        description: "Promoted listings",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        name: "Users",
        href: "/users",
        icon: Users,
        description: "Accounts, roles and suspensions",
      },
      {
        name: "Vendors",
        href: "/vendors",
        icon: Store,
        description: "Registered storefronts",
      },
      {
        name: "Approvals",
        href: "/vendors/approvals",
        icon: ClipboardCheck,
        description: "Pending vendor applications",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        name: "Commissions",
        href: "/commissions",
        icon: Banknote,
        description: "Rates, billing and collection",
      },
    ],
  },
  {
    label: "Engage",
    items: [
      {
        name: "Notifications",
        href: "/broadcasts",
        icon: Megaphone,
        description: "Push to everyone or specific users",
      },
      {
        name: "Flash Sales",
        href: "/flash-sales",
        icon: Timer,
        description: "Scheduled sales and their products",
      },
      {
        name: "Hero Banners",
        href: "/hero-banners",
        icon: Images,
        description: "Home screen slideshow",
      },
      {
        name: "Support",
        href: "/tickets",
        icon: LifeBuoy,
        description: "User and vendor tickets",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Releases",
        href: "/releases",
        icon: Rocket,
        description: "Maintenance mode and app versions",
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Global configuration",
      },
      {
        name: "Health & Audit",
        href: "/health",
        icon: Activity,
        description: "Database metrics and audit trail",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * The five destinations that earn a permanent slot in the mobile thumb zone.
 * Everything else lives behind "More".
 */
export const BOTTOM_NAV_HREFS = ["/", "/orders", "/products", "/vendors"];

/**
 * Nested routes (`/products/categories`) are their own nav entries, so a parent
 * must not light up for its children — only "/" and exact matches count.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href;
}

export function findNavItem(href: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => item.href === href);
}
