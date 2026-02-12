import * as SecureStore from "expo-secure-store";
import type {
  Restaurant, MenuItem, Order, Review, Notification,
  ServiceProvider, Service, Booking, ServiceReview,
  CommunityEvent, Business, Announcement,
  YellowPageListing,
  MobileProfile, MobileHomeFeed,
  TerminalReader, TerminalPaymentIntent,
} from "../types";

const API_BASE = "https://brazadash.com";

async function getSessionCookie(): Promise<string | null> {
  return SecureStore.getItemAsync("session_cookie");
}

export async function setSessionCookie(cookie: string): Promise<void> {
  await SecureStore.setItemAsync("session_cookie", cookie);
}

export async function clearSessionCookie(): Promise<void> {
  await SecureStore.deleteItemAsync("session_cookie");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cookie = await getSessionCookie();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    throw new AuthError("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(body.message || `HTTP ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const api = {
  getRestaurants: () => request<Restaurant[]>("/api/restaurants"),
  getRestaurant: (id: string) => request<Restaurant>(`/api/restaurants/${id}`),
  getMenu: (restaurantId: string) => request<MenuItem[]>(`/api/restaurants/${restaurantId}/menu`),
  getRestaurantReviews: (restaurantId: string) => request<Review[]>(`/api/restaurants/${restaurantId}/reviews`),

  getOrders: () => request<Order[]>("/api/orders"),
  getOrder: (id: number | string) => request<Order>(`/api/orders/${id}`),
  createOrder: (data: {
    restaurantId: string;
    items: { menuItemId: string; name: string; price: string; quantity: number }[];
    subtotal: string;
    deliveryFee: string;
    tip: string;
    total: string;
    deliveryAddress: string;
    notes?: string;
  }) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(data) }),

  submitReview: (data: {
    orderId: string;
    restaurantId: string;
    rating: number;
    foodQualityRating?: number;
    deliveryRating?: number;
    valueRating?: number;
    comment?: string;
  }) => request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),

  getNotifications: () => request<Notification[]>("/api/notifications"),
  markNotificationRead: (id: string) =>
    request<Notification>(`/api/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ isRead: true }) }),

  getServiceProviders: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<ServiceProvider[]>(`/api/services/providers${qs ? `?${qs}` : ""}`);
  },
  getServiceProvider: (id: string) => request<ServiceProvider>(`/api/services/providers/${id}`),
  getProviderServices: (id: string) => request<Service[]>(`/api/services/providers/${id}/services`),
  getProviderReviews: (id: string) => request<ServiceReview[]>(`/api/services/providers/${id}/reviews`),

  getBookings: () => request<Booking[]>("/api/bookings"),
  getBooking: (id: number | string) => request<Booking>(`/api/bookings/${id}`),
  createBooking: (data: {
    providerId: string;
    serviceId?: string;
    requestedDate: string;
    requestedTime: string;
    address?: string;
    notes?: string;
  }) => request<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),

  submitServiceReview: (data: {
    bookingId: string;
    providerId: string;
    rating: number;
    professionalismRating?: number;
    communicationRating?: number;
    valueRating?: number;
    comment?: string;
  }) => request<ServiceReview>("/api/services/reviews", { method: "POST", body: JSON.stringify(data) }),

  getEvents: (category?: string) => {
    const qs = category ? `?category=${category}` : "";
    return request<CommunityEvent[]>(`/api/community/events${qs}`);
  },
  getFeaturedEvents: () => request<CommunityEvent[]>("/api/community/events/featured"),
  getEvent: (id: string) => request<CommunityEvent>(`/api/community/events/${id}`),
  rsvpEvent: (id: string, status: "going" | "interested" | "not_going") =>
    request(`/api/community/events/${id}/rsvp`, { method: "POST", body: JSON.stringify({ status }) }),

  getBusinesses: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<Business[]>(`/api/community/businesses${qs ? `?${qs}` : ""}`);
  },

  getYellowPages: (params?: { category?: string; city?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.city) query.set("city", params.city);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<YellowPageListing[]>(`/api/community/yellow-pages${qs ? `?${qs}` : ""}`);
  },
  getYellowPage: (id: string) => request<YellowPageListing>(`/api/community/yellow-pages/${id}`),
  getYellowPageCities: () => request<string[]>("/api/community/yellow-pages/cities"),
  getYellowPageCategories: () =>
    request<{ id: string; name: string }[]>("/api/community/yellow-pages/categories"),

  getAnnouncements: () => request<Announcement[]>("/api/community/announcements"),

  getMobileProfile: () => request<MobileProfile>("/api/mobile/profile"),
  getMobileHome: () => request<MobileHomeFeed>("/api/mobile/home"),

  registerPushToken: (data: { token: string; platform: "ios" | "android" | "web"; deviceId?: string }) =>
    request("/api/mobile/push-token", { method: "POST", body: JSON.stringify(data) }),
  deactivatePushToken: (token: string) =>
    request("/api/mobile/push-token", { method: "DELETE", body: JSON.stringify({ token }) }),

  getAuthStatus: () => request<{ user?: { claims: Record<string, string> } }>("/api/auth/user"),

  getVendorRestaurants: () => request<Restaurant[]>("/api/vendor/restaurants"),
  
  toggleTerminal: (restaurantId: string, terminalEnabled: boolean) =>
    request("/api/terminal/settings", {
      method: "PATCH",
      body: JSON.stringify({ restaurantId, terminalEnabled }),
    }),

  updateTerminalSettings: (restaurantId: string, terminalEnabled?: boolean, terminalTippingEnabled?: boolean) =>
    request("/api/terminal/settings", {
      method: "PATCH",
      body: JSON.stringify({ restaurantId, ...(terminalEnabled !== undefined && { terminalEnabled }), ...(terminalTippingEnabled !== undefined && { terminalTippingEnabled }) }),
    }),

  setupTerminalLocation: (restaurantId: string, postalCode: string) =>
    request<{ locationId: string }>("/api/terminal/locations", {
      method: "POST",
      body: JSON.stringify({ restaurantId, postalCode }),
    }),

  getTerminalReaders: (restaurantId: string) =>
    request<{ readers: TerminalReader[] }>(`/api/terminal/readers?restaurantId=${restaurantId}`),

  createTerminalPaymentIntent: (restaurantId: string, amount: string, description?: string, readerId?: string) =>
    request<TerminalPaymentIntent>("/api/terminal/payment-intents", {
      method: "POST",
      body: JSON.stringify({ restaurantId, amount, description, readerId }),
    }),

  checkTerminalPaymentStatus: (paymentIntentId: string) =>
    request<{ id: string; status: string; amount: number; description: string; metadata: Record<string, string> }>(
      `/api/terminal/payment-intents/${paymentIntentId}/status`
    ),

  captureTerminalPayment: (paymentIntentId: string) =>
    request<{ id: string; status: string; amount: number; description: string }>(
      `/api/terminal/payment-intents/${paymentIntentId}/capture`,
      { method: "POST" }
    ),

  cancelTerminalReaderAction: (readerId: string, restaurantId: string) =>
    request(`/api/terminal/readers/${readerId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ restaurantId }),
    }),

  createTerminalConnectionToken: () =>
    request<{ secret: string }>("/api/terminal/connection-token", { method: "POST" }),

  getUserRole: () => request<{ roles: string[]; approvalStatus: Record<string, string> }>("/api/user/role"),
  
  setUserRole: (role: "customer" | "vendor" | "service_provider", businessInfo?: any) =>
    request<{ roles: string[]; approvalStatus: Record<string, string> }>("/api/user/role", {
      method: "POST",
      body: JSON.stringify({ role, businessInfo }),
    }),

  exchangeAuthCode: async (code: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/mobile/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      throw new Error("Failed to exchange auth code");
    }
    const data = await res.json();
    return data.session;
  },
};
