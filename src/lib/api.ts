// Typed client for the Acting Driver FastAPI backend.
// All error responses share the envelope { "error": { "code", "message" } }.

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

export const API_URL = (env["VITE_API_URL"] ?? "http://localhost:8000").replace(/\/+$/, "");
export const WS_URL = API_URL.replace(/^http/, "ws");

export type Role = "customer" | "driver" | "admin";
export type BookingType = "location" | "hourly";
export type BookingStatus =
  | "requested" | "searching" | "driver_assigned" | "trip_started" | "completed" | "cancelled";

export interface AuthUser {
  id: string;
  phone: string;
  email: string;
  name: string | null;
  role: Role;
  created_at: string | null;
  is_new_user?: boolean;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export interface DriverBrief {
  driver_id: string;
  name: string | null;
  phone?: string;
  rating_avg: number;
  total_trips: number;
  pickup_distance_km?: number;
}

export interface BookingFares {
  base_fare?: number | null;
  pickup_charge?: number | null;
  total_fare?: number | null;
  cancellation_fee?: number | null;
}

export interface Booking {
  id: string;
  customer_id: string;
  driver_id: string | null;
  type: BookingType;
  status: BookingStatus;
  pickup: { lat: number; lng: number; address_text: string | null; approximate?: boolean };
  drop: { lat: number; lng: number; address_text: string | null } | null;
  hours: number | null;
  trip_distance_km: number | null;
  pickup_distance_km: number | null;
  fares: BookingFares;
  payment_status: "pending" | "collected";
  cancelled_by: Role | null;
  phone_revealed: boolean;
  requested_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  driver?: DriverBrief | null;
  customer?: { name: string | null; phone: string };
  rating?: { rating: number; review_text: string | null };
  status_log?: { status: string; note: string | null; changed_at: string | null }[];
}

export interface DriverProfile {
  driver_id: string;
  user_id: string;
  name: string | null;
  phone: string;
  email: string;
  license_no: string | null;
  license_doc_url: string | null;
  is_verified: boolean;
  verification_status: "pending" | "approved" | "rejected";
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating_avg: number;
  total_trips: number;
  cancellation_count: number;
  created_by: "self_signup" | "admin";
  created_at: string | null;
}

export interface FareEstimate {
  type: BookingType;
  trip_distance_km: number | null;
  hours: number | null;
  base_fare: number;
  estimated_total_fare: number;
  pickup_charge: { free_km_limit: number; per_km_beyond_limit: number; note: string };
}

export interface CustomerProfile {
  user_id: string;
  phone: string;
  email: string;
  name: string | null;
  pending_dues: number;
  member_since?: string | null;
}

export interface PricingConfig {
  per_km_rate: number;
  per_hour_rate: number;
  pickup_free_km_limit: number;
  pickup_charge_per_km: number;
  cancellation_fee_percent: number;
  matching_radius_km: number;
  block_booking_if_dues_exceed: boolean;
  updated_at: string | null;
}

export interface Earnings {
  total_earnings: number;
  collected: number;
  pending_payment: number;
  total_trips: number;
  completed_bookings: number;
}

export interface CreateBookingPayload {
  type: BookingType;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address_text?: string | null;
  drop_lat?: number;
  drop_lng?: number;
  drop_address_text?: string | null;
  hours?: number;
}

// ---------------------------------------------------------------------------
// Fetch plumbing
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  code: string;
  /** true when the backend itself could not be reached */
  network: boolean;

  constructor(message: string, status = 0, code = "network_error", network = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.network = network;
  }
}

async function request<T>(path: string, options: {
  method?: string;
  body?: unknown;
  token?: string | null;
  formData?: FormData;
} = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const body = options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : null);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      ...(body !== null ? { body } : {}),
    });
  } catch {
    throw new ApiError(
      `Cannot reach the backend at ${API_URL}. Is it running on port 8000?`,
      0, "network_error", true,
    );
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok) {
    const envelope = data as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      envelope?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      envelope?.error?.code ?? "error",
    );
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Session persistence (per role, so one browser can be customer + driver)
// ---------------------------------------------------------------------------

const sessionKey = (role: Role) => `acting_driver_session_${role}`;

export function loadSession(role: Role): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(sessionKey(role));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed?.user?.id) return null;
    // Heal sessions stored under the wrong role (e.g. saved before the backend
    // started rejecting cross-role logins) — a customer token in the driver
    // app just 403s on every call.
    if (parsed.user.role !== role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeSession(role: Role, session: Session | null): void {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(sessionKey(role), JSON.stringify(session));
  else window.localStorage.removeItem(sessionKey(role));
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  // Phone + email are both required — the OTP is delivered to the email
  // (OTP_PROVIDER=email). `otp` only comes back in mock mode.
  sendOtp: (phone: string, email: string) =>
    request<{ message: string; expires_in_seconds: number; otp?: string }>(
      "/api/auth/send-otp", { method: "POST", body: { phone, email } },
    ),

  verifyOtp: (phone: string, otp: string, role: "customer" | "driver") =>
    request<{ access_token: string; token_type: string; user: AuthUser }>(
      "/api/auth/verify-otp", { method: "POST", body: { phone, otp, role } },
    ),

  adminLogin: (phone: string, password: string) =>
    request<{ access_token: string; token_type: string; user: AuthUser }>(
      "/api/admin/login", { method: "POST", body: { phone, password } },
    ),
};

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export const customerApi = {
  profile: (token: string) =>
    request<CustomerProfile>("/api/customer/profile", { token }),

  updateProfile: (token: string, name: string) =>
    request<CustomerProfile>("/api/customer/profile", { method: "PUT", body: { name }, token }),

  bookings: (token: string, status?: BookingStatus) =>
    request<{ bookings: Booking[]; count: number }>(
      `/api/customer/bookings${status ? `?status=${status}` : ""}`, { token },
    ),

  booking: (token: string, id: string) =>
    request<Booking>(`/api/bookings/${id}`, { token }),

  dues: (token: string) =>
    request<{ pending_dues: number; has_dues: boolean }>("/api/customer/dues", { token }),

  fareEstimate: (
    token: string,
    params: { type: BookingType; pickup_lat: number; pickup_lng: number; drop_lat?: number; drop_lng?: number; hours?: number },
  ) => {
    const qs = new URLSearchParams({
      type: params.type,
      pickup_lat: String(params.pickup_lat),
      pickup_lng: String(params.pickup_lng),
    });
    if (params.drop_lat != null) qs.set("drop_lat", String(params.drop_lat));
    if (params.drop_lng != null) qs.set("drop_lng", String(params.drop_lng));
    if (params.hours != null) qs.set("hours", String(params.hours));
    return request<FareEstimate>(`/api/bookings/fare-estimate?${qs}`, { token });
  },

  createBooking: (token: string, payload: CreateBookingPayload) =>
    request<{ booking: Booking; message: string; warning?: { pending_dues: number; message: string } }>(
      "/api/bookings", { method: "POST", body: payload, token },
    ),

  cancelBooking: (token: string, id: string) =>
    request<{ booking: Booking; cancellation_fee: number; fee_applied: boolean; message: string }>(
      `/api/bookings/${id}/cancel`, { method: "POST", token },
    ),

  rateBooking: (token: string, id: string, rating: number, review_text?: string) =>
    request<{ booking: Booking; message: string }>(
      `/api/bookings/${id}/rate`, { method: "POST", body: { rating, review_text }, token },
    ),
};

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

export const driverApi = {
  profile: (token: string) => request<DriverProfile>("/api/driver/profile", { token }),

  updateProfile: (token: string, payload: { name?: string; license_no?: string }) =>
    request<DriverProfile>("/api/driver/profile", { method: "PUT", body: payload, token }),

  uploadDocument: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ verification_status: string; message?: string }>(
      "/api/driver/documents", { method: "POST", formData, token },
    );
  },

  setOnline: (token: string, is_online: boolean) =>
    request<DriverProfile>("/api/driver/online-status", { method: "PATCH", body: { is_online }, token }),

  sendLocation: (token: string, lat: number, lng: number) =>
    request<{ lat: number; lng: number; updated: boolean }>(
      "/api/driver/location", { method: "PATCH", body: { lat, lng }, token },
    ),

  bookings: (token: string, status?: BookingStatus) =>
    request<{ bookings: Booking[]; count: number }>(
      `/api/driver/bookings${status ? `?status=${status}` : ""}`, { token },
    ),

  earnings: (token: string) => request<Earnings>("/api/driver/earnings", { token }),

  accept: (token: string, id: string) =>
    request<{ booking: Booking; message: string }>(`/api/bookings/${id}/accept`, { method: "POST", token }),

  reject: (token: string, id: string) =>
    request<{ message: string }>(`/api/bookings/${id}/reject`, { method: "POST", token }),

  startTrip: (token: string, id: string) =>
    request<{ booking: Booking; message: string }>(`/api/bookings/${id}/start-trip`, { method: "POST", token }),

  completeTrip: (token: string, id: string) =>
    request<{ booking: Booking; message: string }>(`/api/bookings/${id}/complete-trip`, { method: "POST", token }),

  markPaid: (token: string, id: string) =>
    request<{ booking: Booking; message: string }>(`/api/bookings/${id}/mark-paid`, { method: "POST", token }),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  drivers: (token: string, verification_status?: "pending" | "approved" | "rejected") =>
    request<{ drivers: DriverProfile[]; count: number }>(
      `/api/admin/drivers${verification_status ? `?verification_status=${verification_status}` : ""}`,
      { token },
    ),

  createDriver: (token: string, payload: {
    phone: string; name: string; license_no: string;
    license_doc_url: string | null; pre_verified: boolean;
  }) =>
    request<DriverProfile>("/api/admin/drivers", { method: "POST", body: payload, token }),

  verifyDriver: (token: string, driverId: string, action: "approve" | "reject") =>
    request<DriverProfile>(`/api/admin/drivers/${driverId}/verify`, {
      method: "PATCH", body: { action }, token,
    }),

  bookings: (token: string, status?: BookingStatus, limit = 200) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (status) qs.set("status", status);
    return request<{ bookings: Booking[]; count: number }>(`/api/admin/bookings?${qs}`, { token });
  },

  pricing: (token: string) => request<PricingConfig>("/api/admin/pricing-config", { token }),

  updatePricing: (token: string, payload: Partial<PricingConfig>) =>
    request<PricingConfig>("/api/admin/pricing-config", { method: "PUT", body: payload, token }),

  dues: (token: string) =>
    request<{ customers: { customer_id: string; name: string | null; phone: string; pending_dues: number }[]; count: number }>(
      "/api/admin/customers/dues", { token },
    ),

  clearDues: (token: string, customerId: string) =>
    request<{ customer_id: string; cleared_amount: number; pending_dues: number }>(
      `/api/admin/customers/${customerId}/clear-dues`, { method: "PATCH", token },
    ),
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function money(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function km(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Number(value).toFixed(1)} km`;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  const monthDay = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${monthDay}, ${time}`;
}

export const STATUS_META: Record<BookingStatus, { label: string; tone: "blue" | "green" | "orange" | "red" }> = {
  requested: { label: "Requested", tone: "blue" },
  searching: { label: "Finding driver", tone: "blue" },
  driver_assigned: { label: "Driver assigned", tone: "blue" },
  trip_started: { label: "In progress", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export const ACTIVE_STATUSES: BookingStatus[] = [
  "requested", "searching", "driver_assigned", "trip_started",
];

export function initials(name: string | null | undefined, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || fallback;
}

/** Bengaluru demo destinations — the mock distance provider only needs coordinates. */
export const DEMO_PLACES: { name: string; lat: number; lng: number }[] = [
  { name: "Indiranagar, 100ft Road", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala, 4th Block", lat: 12.9352, lng: 77.6245 },
  { name: "HSR Layout, Sector 2", lat: 12.9116, lng: 77.6389 },
  { name: "MG Road", lat: 12.9756, lng: 77.6068 },
  { name: "Whitefield, ITPL", lat: 12.9698, lng: 77.7500 },
  { name: "Electronic City", lat: 12.8452, lng: 77.6602 },
  { name: "Kempegowda Airport", lat: 13.1986, lng: 77.7066 },
];

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => reject(new Error(err.message)), {
      enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000,
    });
  });
}
