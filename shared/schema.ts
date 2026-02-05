import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// User roles enum
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: varchar("role", { enum: ["customer", "vendor", "service_provider", "admin"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cuisine: varchar("cuisine", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  imageUrl: text("image_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("3.99"),
  deliveryTime: varchar("delivery_time", { length: 50 }).default("30-45 min"),
  isOpen: boolean("is_open").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 100 }),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  restaurantId: varchar("restaurant_id").notNull(),
  status: varchar("status", { 
    enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"] 
  }).notNull().default("pending"),
  items: jsonb("items").notNull(), // Array of {menuItemId, name, price, quantity}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  stripeSessionId: varchar("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table (food orders)
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  restaurantId: varchar("restaurant_id").notNull(),
  rating: integer("rating").notNull(),
  foodQualityRating: integer("food_quality_rating"),
  deliveryRating: integer("delivery_rating"),
  valueRating: integer("value_rating"),
  comment: text("comment"),
  photoUrls: text("photo_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { enum: ["order", "promo", "system", "booking", "message"] }).notNull().default("system"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// SERVICES MARKETPLACE TABLES
// ============================================

// Service categories
export const serviceCategories = [
  "cleaning",
  "beauty",
  "auto",
  "legal",
  "immigration",
  "fitness",
  "education",
  "construction",
  "photography",
  "translation",
  "other"
] as const;

// Service providers table
export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  subcategories: text("subcategories"), // comma-separated list
  address: text("address"),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  imageUrl: text("image_url"),
  galleryImages: jsonb("gallery_images"), // Array of image URLs
  certifications: jsonb("certifications"), // Array of {name, issuer, year}
  languages: text("languages").default("Portuguese, English"),
  yearsExperience: integer("years_experience").default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  priceRange: varchar("price_range", { length: 20 }).default("$$"), // $, $$, $$$
  availability: jsonb("availability"), // {monday: {start: "09:00", end: "17:00"}, ...}
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services offered by providers
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceType: varchar("price_type", { enum: ["fixed", "hourly", "quote"] }).default("fixed"),
  duration: integer("duration"), // in minutes
  category: varchar("category", { length: 100 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  serviceId: varchar("service_id"),
  status: varchar("status", { 
    enum: ["pending", "accepted", "declined", "confirmed", "in_progress", "completed", "cancelled"] 
  }).notNull().default("pending"),
  requestedDate: timestamp("requested_date"),
  requestedTime: varchar("requested_time", { length: 20 }),
  confirmedDate: timestamp("confirmed_date"),
  confirmedTime: varchar("confirmed_time", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  price: decimal("price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service reviews table
export const serviceReviews = pgTable("service_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  rating: integer("rating").notNull(),
  professionalismRating: integer("professionalism_rating"),
  communicationRating: integer("communication_rating"),
  valueRating: integer("value_rating"),
  comment: text("comment"),
  photoUrls: text("photo_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for in-app chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  bookingId: varchar("booking_id"), // Optional link to booking
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: varchar("attachment_type", { length: 50 }), // image, file, etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas - Food Marketplace
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true });

// Insert schemas - Services Marketplace
export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceReviewSchema = createInsertSchema(serviceReviews).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// Types
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

// Services Marketplace Types
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertServiceReview = z.infer<typeof insertServiceReviewSchema>;
export type ServiceReview = typeof serviceReviews.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type ServiceCategory = typeof serviceCategories[number];

// Cart item type (for frontend state)
export type CartItem = {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
};

// ============================================
// COMMUNITY HUB TABLES (EPIC 6)
// ============================================

// Event categories
export const eventCategories = [
  "festival",
  "concert",
  "meetup",
  "sports",
  "cultural",
  "food",
  "workshop",
  "other"
] as const;

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  imageUrl: text("image_url"),
  venue: varchar("venue", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"),
  startTime: varchar("start_time", { length: 20 }),
  endTime: varchar("end_time", { length: 20 }),
  ticketUrl: text("ticket_url"),
  ticketPrice: varchar("ticket_price", { length: 100 }),
  isFree: boolean("is_free").default(false),
  isFeatured: boolean("is_featured").default(false),
  isApproved: boolean("is_approved").default(false),
  attendeeCount: integer("attendee_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business directory table
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }).default("CA"),
  zipCode: varchar("zip_code", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  imageUrl: text("image_url"),
  hours: jsonb("hours"), // {monday: "9am-5pm", ...}
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isBrazilianOwned: boolean("is_brazilian_owned").default(true),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { enum: ["news", "promo", "update", "alert"] }).notNull().default("news"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkText: varchar("link_text", { length: 100 }),
  isPinned: boolean("is_pinned").default(false),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event RSVPs
export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: varchar("status", { enum: ["going", "interested", "not_going"] }).notNull().default("going"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas - Community Hub
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, attendeeCount: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, viewCount: true });
export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({ id: true, createdAt: true });

// Community Hub Types
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;

export type EventCategory = typeof eventCategories[number];
