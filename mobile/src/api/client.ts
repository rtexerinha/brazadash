import * as SecureStore from "expo-secure-store";
import type {
  Restaurant, MenuItem, Order, Review, Notification,
  ServiceProvider, Service, Booking, ServiceReview,
  CommunityEvent, Business, Announcement,
  MobileProfile, MobileHomeFeed,
} from "../types";

const API_BASE = "https://brazadash.replit.app";

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

  getAnnouncements: () => request<Announcement[]>("/api/community/announcements"),

  getMobileProfile: () => request<MobileProfile>("/api/mobile/profile"),
  getMobileHome: () => request<MobileHomeFeed>("/api/mobile/home"),

  registerPushToken: (data: { token: string; platform: "ios" | "android" | "web"; deviceId?: string }) =>
    request("/api/mobile/push-token", { method: "POST", body: JSON.stringify(data) }),
  deactivatePushToken: (token: string) =>
    request("/api/mobile/push-token", { method: "DELETE", body: JSON.stringify({ token }) }),

  getAuthStatus: () => request<{ user?: { claims: Record<string, string> } }>("/api/auth/user"),
};
