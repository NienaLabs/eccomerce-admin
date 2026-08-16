export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: "admin" | "vendor" | "user" | string;
  is_active?: boolean;
  is_suspended?: boolean;
};

export type Vendor = {
  id: string;
  owner_id?: string;
  store_name?: string | null;
  is_verified?: boolean;
  created_at?: string;
  cancellation_count?: number;
  flagged_for_cancellations?: boolean;
  /**
   * Whether this vendor may use the AI assistant. Half the gate — the
   * platform-wide `ai_assistant_enabled` setting is the other half, and both
   * must be on before the vendor can reach it.
   */
  ai_assistant_enabled?: boolean;
};

export type KYCDocument = {
  id: string;
  document_type: string;
  document_url: string;
  uploaded_at: string;
};

export type VendorApplication = {
  id: string;
  user_id: string;
  business_name: string;
  business_registration_number?: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string | null;
  applied_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  documents: KYCDocument[];
};

export type Product = {
  id: string;
  title?: string | null;
  name?: string | null;
  price?: number | string | null;
};

export type OverviewMetrics = {
  total_users?: number;
  total_vendors?: number;
  total_orders?: number;
  total_gmv?: number | string;
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  created_at: string;
  is_suspended?: boolean;
}

export interface AdminProduct {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  description: string;
  actual_price: number;
  discount_price?: number;
  is_active: boolean;
  is_featured: boolean;
  admin_price_override?: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

export interface SystemAuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export interface DatabaseHealth {
  status: string;
  total_users: number;
  total_vendors: number;
  total_products: number;
  db_size_mb: number;
  active_connections: number;
}

export interface SystemBroadcast {
  id: string;
  admin_id: string | null;
  title: string;
  message: string;
  /** "all" | "users" | "vendors" | "specific" */
  target_audience: string;
  /** Populated only for a targeted send. */
  target_user_ids?: string[] | null;
  created_at: string;
}

/** Platform-wide analytics — GET /analytics/admin/overview. */
export interface PlatformOverview {
  total_users: number;
  total_vendors: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  orders_today: number;
  revenue_today: number;
  pending_orders: number;
  top_vendors: {
    vendor_id?: string;
    store_name?: string;
    revenue?: number;
    order_count?: number;
  }[];
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface AdminOrder {
  id: string;
  user_id: string;
  user_email?: string | null;
  user_name?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount?: number | null;
  shipping_fee?: number | null;
  total_amount: number;
  item_count: number;
  vendor_names: string[];
  agent_name?: string | null;
  agent_phone?: string | null;
  commission_aggregated: boolean;
  created_at?: string | null;
}

export interface AdminOrderItem {
  id: string;
  product_id: string;
  product_name?: string | null;
  vendor_id: string;
  vendor_name?: string | null;
  quantity: number;
  unit_price: number;
  discount_price?: number | null;
}

export interface AdminOrderDetail extends AdminOrder {
  shipping_address?: Record<string, unknown> | null;
  notes?: string | null;
  items: AdminOrderItem[];
  status_history: { status: string; note?: string | null; changed_at?: string | null }[];
}

export interface AdminOrderPage {
  items: AdminOrder[];
  total: number;
  skip: number;
  limit: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  priority: "high" | "medium" | "low";
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export interface FlashSaleItem {
  id: string;
  product_id: string;
  product_name?: string | null;
  image_url?: string | null;
  actual_price?: number | null;
  discount_price?: number | null;
  /** Sale-specific price; null means use the product's own discount. */
  sale_price?: number | null;
}

export interface FlashSale {
  id: string;
  title: string;
  subtitle?: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at?: string | null;
  items: FlashSaleItem[];
  /** Active AND inside its window — what shoppers actually see. */
  is_live: boolean;
}

export type HeroBanner = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export async function apiFetch(path: string, token?: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: init?.cache ?? "no-store",
  });
}

/**
 * Browser-safe API call for client components. Routes through the same-origin
 * `/api/backend` proxy, which injects the admin bearer token from the httpOnly
 * cookie on the server. The token is never exposed to client JS — client
 * components must use this instead of hitting API_BASE_URL with a token prop.
 */
export async function clientApi(path: string, init?: RequestInit) {
  return fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export async function fetchJson<T>(path: string, token: string | undefined, fallback: T): Promise<T> {
  try {
    const res = await apiFetch(path, token);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchList<T>(path: string, token?: string): Promise<T[]> {
  const data = await fetchJson<unknown>(path, token, []);
  return Array.isArray(data) ? (data as T[]) : [];
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(token: string): Promise<NotificationResponse[]> {
  const res = await apiFetch("/notifications/", token);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(token: string, notificationId: string): Promise<NotificationResponse> {
  const res = await apiFetch(`/notifications/${notificationId}/read`, token, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark notification read");
  return res.json();
}

export async function deleteNotification(token: string, notificationId: string): Promise<void> {
  const res = await apiFetch(`/notifications/${notificationId}`, token, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete notification");
}

export async function clearAllNotifications(token: string): Promise<void> {
  const res = await apiFetch(`/notifications/clear-all`, token, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to clear notifications");
}

/**
 * Maps a backend notification `action_url` to a real admin route.
 * Backend links point at app-style paths; the admin dashboard has its own.
 */
export function resolveAdminNotificationRoute(actionUrl?: string): string | null {
  if (!actionUrl) return null;
  // Vendor-flag notifications already point at /vendors?flagged=...
  if (actionUrl.startsWith("/vendors")) return actionUrl;
  // Order-related notifications → the vendor/orders views the admin has.
  if (actionUrl.includes("/orders")) return "/vendors";
  if (actionUrl.startsWith("/tickets")) return "/tickets";
  return null;
}
