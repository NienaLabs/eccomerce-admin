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
  stock_quantity: number;
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
  target_audience: string;
  created_at: string;
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
