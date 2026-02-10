export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  imageUrl: string | null;
  rating: string;
  reviewCount: number;
  deliveryFee: string;
  deliveryTime: string;
  isOpen: boolean;
  isActive: boolean;
  terminalEnabled?: boolean;
  terminalLocationId?: string | null;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  items: { menuItemId: string; name: string; price: string; quantity: number }[];
  subtotal: string;
  deliveryFee: string;
  tip: string;
  total: string;
  deliveryAddress: string | null;
  notes: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number;
  foodQualityRating: number | null;
  deliveryRating: number | null;
  valueRating: number | null;
  comment: string | null;
  photoUrls: string[] | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "promo" | "system" | "booking" | "message";
  isRead: boolean;
  createdAt: string;
}

export type ServiceCategory =
  | "cleaning" | "beauty" | "auto" | "legal" | "immigration"
  | "fitness" | "education" | "construction" | "photography"
  | "translation" | "other";

export interface ServiceProvider {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  category: string;
  subcategories: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  imageUrl: string | null;
  galleryImages: string[] | null;
  certifications: { name: string; issuer: string; year: number }[] | null;
  languages: string;
  yearsExperience: number;
  rating: string;
  reviewCount: number;
  priceRange: string;
  availability: Record<string, { start: string; end: string }> | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  price: string | null;
  priceType: "fixed" | "hourly" | "quote";
  duration: number | null;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string | null;
  status: "pending" | "accepted" | "declined" | "confirmed" | "in_progress" | "completed" | "cancelled";
  requestedDate: string | null;
  requestedTime: string | null;
  confirmedDate: string | null;
  confirmedTime: string | null;
  address: string | null;
  notes: string | null;
  price: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReview {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  professionalismRating: number | null;
  communicationRating: number | null;
  valueRating: number | null;
  comment: string | null;
  photoUrls: string[] | null;
  createdAt: string;
}

export type EventCategory =
  | "festival" | "concert" | "meetup" | "sports"
  | "cultural" | "food" | "workshop" | "other";

export interface CommunityEvent {
  id: string;
  createdBy: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  eventDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  ticketUrl: string | null;
  ticketPrice: string | null;
  isFree: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  attendeeCount: number;
  createdAt: string;
}

export interface Business {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  imageUrl: string | null;
  hours: Record<string, string> | null;
  latitude: string | null;
  longitude: string | null;
  isBrazilianOwned: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  createdBy: string;
  title: string;
  content: string;
  type: "news" | "promo" | "update" | "alert";
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
  isPinned: boolean;
  isActive: boolean;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
}

export type YellowPageCategory =
  | "room" | "shared-room" | "house" | "apartment" | "car" | "other";

export interface YellowPageListing {
  id: string;
  createdBy: string;
  title: string;
  description: string | null;
  category: string;
  price: string | null;
  city: string;
  state: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  imageUrl: string | null;
  images: string[] | null;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface MobileProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  roles: string[];
  stats: {
    totalOrders: number;
    totalBookings: number;
    activeDevices: number;
  };
}

export interface MobileHomeFeed {
  restaurants: Restaurant[];
  upcomingEvents: CommunityEvent[];
  announcements: Announcement[];
  featuredProviders: ServiceProvider[];
  unreadNotifications: number;
}

export interface TerminalReader {
  id: string;
  label: string;
  deviceType: string;
  status: string;
  serialNumber?: string;
  ipAddress?: string;
}

export interface TerminalPaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  platformFee: number;
}
