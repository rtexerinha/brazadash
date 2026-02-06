import { 
  restaurants, menuItems, orders, reviews, notifications, userRoles,
  serviceProviders, services, bookings, serviceReviews, messages,
  events, businesses, announcements, eventRsvps, pushTokens,
  type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type Review, type InsertReview,
  type Notification, type InsertNotification,
  type UserRole, type InsertUserRole,
  type ServiceProvider, type InsertServiceProvider,
  type Service, type InsertService,
  type Booking, type InsertBooking,
  type ServiceReview, type InsertServiceReview,
  type Message, type InsertMessage,
  type Event, type InsertEvent,
  type Business, type InsertBusiness,
  type Announcement, type InsertAnnouncement,
  type EventRsvp, type InsertEventRsvp,
  type PushToken, type InsertPushToken
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, data: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  
  // Menu Items
  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<void>;
  
  // Orders
  getOrders(customerId: string): Promise<(Order & { restaurant?: { name: string } })[]>;
  getOrder(id: string): Promise<(Order & { restaurant?: { name: string }; hasReview?: boolean }) | undefined>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  getOrderByStripeSession(sessionId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Reviews
  getReviewsByRestaurant(restaurantId: string): Promise<Review[]>;
  getReviewByOrder(orderId: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateRestaurantRating(restaurantId: string): Promise<void>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // User Roles
  getUserRole(userId: string): Promise<UserRole | undefined>;
  createUserRole(role: InsertUserRole): Promise<UserRole>;
  updateUserRoleApproval(userId: string, role: string, approvalStatus: string): Promise<UserRole | undefined>;
  getPendingApprovals(): Promise<UserRole[]>;
  
  // Service Providers
  getServiceProviders(category?: string): Promise<ServiceProvider[]>;
  getServiceProvider(id: string): Promise<ServiceProvider | undefined>;
  getServiceProviderByUser(userId: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  updateServiceProvider(id: string, data: Partial<InsertServiceProvider>): Promise<ServiceProvider | undefined>;
  searchServiceProviders(query: string, category?: string): Promise<ServiceProvider[]>;
  
  // Services
  getServices(providerId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;
  
  // Bookings
  getBookings(customerId: string): Promise<(Booking & { provider?: { businessName: string } })[]>;
  getBooking(id: string): Promise<(Booking & { provider?: ServiceProvider; service?: Service }) | undefined>;
  getBookingsByProvider(providerId: string): Promise<Booking[]>;
  getBookingByStripeSession(sessionId: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string, data?: Partial<InsertBooking>): Promise<Booking | undefined>;
  
  // Service Reviews
  getServiceReviewsByProvider(providerId: string): Promise<ServiceReview[]>;
  getServiceReviewByBooking(bookingId: string): Promise<ServiceReview | undefined>;
  createServiceReview(review: InsertServiceReview): Promise<ServiceReview>;
  updateProviderRating(providerId: string): Promise<void>;
  
  // Messages
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<{ partnerId: string; lastMessage: Message }[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesRead(senderId: string, receiverId: string): Promise<void>;
  
  // Events (Community Hub)
  getEvents(category?: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getUpcomingEvents(): Promise<Event[]>;
  getFeaturedEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  
  // Event RSVPs
  getEventRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined>;
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateEventRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp | undefined>;
  getEventAttendees(eventId: string): Promise<EventRsvp[]>;
  
  // Businesses (Community Hub)
  getBusinesses(category?: string): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  searchBusinesses(query: string, category?: string): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<Business | undefined>;
  deleteBusiness(id: string): Promise<void>;
  
  // Announcements (Community Hub)
  getAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<void>;
  incrementAnnouncementViews(id: string): Promise<void>;

  // Push Tokens (Mobile)
  getPushTokens(userId: string): Promise<PushToken[]>;
  getPushTokenByToken(token: string): Promise<PushToken | undefined>;
  registerPushToken(data: InsertPushToken): Promise<PushToken>;
  deactivatePushToken(token: string): Promise<void>;
  deactivateUserPushTokens(userId: string): Promise<void>;

  // Admin Methods
  getAdminStats(): Promise<{
    totalUsers: number;
    totalRestaurants: number;
    totalOrders: number;
    totalProviders: number;
    totalBookings: number;
    totalEvents: number;
    totalBusinesses: number;
    revenue: number;
  }>;
  getAllUsers(): Promise<{ id: string; email: string; firstName: string; lastName: string; roles: string[] }[]>;
  getUserById(id: string): Promise<{ id: string; email: string; firstName: string; lastName: string; roles: string[] } | undefined>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  addUserRole(userId: string, role: string): Promise<UserRole>;
  removeUserRole(userId: string, role: string): Promise<void>;
  getAllRestaurants(): Promise<Restaurant[]>;
  getAllOrders(): Promise<(Order & { restaurant?: { name: string } })[]>;
  getAllBookings(): Promise<Booking[]>;
  getAllEvents(): Promise<Event[]>;
  getAllBusinesses(): Promise<Business[]>;
  getAllAnnouncements(): Promise<Announcement[]>;
  getAllServiceProviders(): Promise<ServiceProvider[]>;
  getAllReviews(): Promise<Review[]>;
  getAllServiceReviews(): Promise<ServiceReview[]>;
  deleteReview(id: string): Promise<void>;
  deleteServiceReview(id: string): Promise<void>;
  deleteRestaurant(id: string): Promise<void>;
  deleteServiceProvider(id: string): Promise<void>;
}

class DatabaseStorage implements IStorage {
  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants).where(eq(restaurants.isActive, true)).orderBy(desc(restaurants.rating));
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    return db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId));
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [created] = await db.insert(restaurants).values(restaurant).returning();
    return created;
  }

  async updateRestaurant(id: string, data: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updated] = await db.update(restaurants).set(data).where(eq(restaurants.id, id)).returning();
    return updated;
  }

  // Menu Items
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: string, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // Orders
  async getOrders(customerId: string): Promise<(Order & { restaurant?: { name: string } })[]> {
    const orderList = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
    
    // Fetch restaurant names
    const result = await Promise.all(
      orderList.map(async (order) => {
        const restaurant = await this.getRestaurant(order.restaurantId);
        return { ...order, restaurant: restaurant ? { name: restaurant.name } : undefined };
      })
    );
    
    return result;
  }

  async getOrder(id: string): Promise<(Order & { restaurant?: { name: string }; hasReview?: boolean }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    
    const restaurant = await this.getRestaurant(order.restaurantId);
    const review = await this.getReviewByOrder(id);
    
    return { 
      ...order, 
      restaurant: restaurant ? { name: restaurant.name } : undefined,
      hasReview: !!review
    };
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.restaurantId, restaurantId)).orderBy(desc(orders.createdAt));
  }

  async getOrderByStripeSession(sessionId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Reviews
  async getReviewsByRestaurant(restaurantId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.restaurantId, restaurantId)).orderBy(desc(reviews.createdAt));
  }

  async getReviewByOrder(orderId: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.orderId, orderId));
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    await this.updateRestaurantRating(review.restaurantId);
    return created;
  }

  async updateRestaurantRating(restaurantId: string): Promise<void> {
    const restaurantReviews = await this.getReviewsByRestaurant(restaurantId);
    if (restaurantReviews.length === 0) return;
    
    const avgRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length;
    await db.update(restaurants)
      .set({ rating: avgRating.toFixed(1), reviewCount: restaurantReviews.length })
      .where(eq(restaurants.id, restaurantId));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  // User Roles
  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role;
  }

  async createUserRole(role: InsertUserRole): Promise<UserRole> {
    const [created] = await db.insert(userRoles).values(role).returning();
    return created;
  }

  async updateUserRoleApproval(userId: string, role: string, approvalStatus: string): Promise<UserRole | undefined> {
    const [updated] = await db.update(userRoles)
      .set({ approvalStatus: approvalStatus as any })
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)))
      .returning();
    return updated;
  }

  async getPendingApprovals(): Promise<UserRole[]> {
    return db.select().from(userRoles).where(eq(userRoles.approvalStatus, "pending")).orderBy(desc(userRoles.createdAt));
  }

  // Service Providers
  async getServiceProviders(category?: string): Promise<ServiceProvider[]> {
    if (category) {
      return db.select().from(serviceProviders)
        .where(and(eq(serviceProviders.isActive, true), eq(serviceProviders.category, category)))
        .orderBy(desc(serviceProviders.rating));
    }
    return db.select().from(serviceProviders)
      .where(eq(serviceProviders.isActive, true))
      .orderBy(desc(serviceProviders.rating));
  }

  async getServiceProvider(id: string): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
    return provider;
  }

  async getServiceProviderByUser(userId: string): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.userId, userId));
    return provider;
  }

  async createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider> {
    const [created] = await db.insert(serviceProviders).values(provider).returning();
    return created;
  }

  async updateServiceProvider(id: string, data: Partial<InsertServiceProvider>): Promise<ServiceProvider | undefined> {
    const [updated] = await db.update(serviceProviders).set(data).where(eq(serviceProviders.id, id)).returning();
    return updated;
  }

  async searchServiceProviders(query: string, category?: string): Promise<ServiceProvider[]> {
    const searchPattern = `%${query}%`;
    let baseQuery = db.select().from(serviceProviders)
      .where(and(
        eq(serviceProviders.isActive, true),
        or(
          ilike(serviceProviders.businessName, searchPattern),
          ilike(serviceProviders.description, searchPattern),
          ilike(serviceProviders.city, searchPattern)
        )
      ));
    
    if (category) {
      baseQuery = db.select().from(serviceProviders)
        .where(and(
          eq(serviceProviders.isActive, true),
          eq(serviceProviders.category, category),
          or(
            ilike(serviceProviders.businessName, searchPattern),
            ilike(serviceProviders.description, searchPattern),
            ilike(serviceProviders.city, searchPattern)
          )
        ));
    }
    
    return baseQuery.orderBy(desc(serviceProviders.rating));
  }

  // Services
  async getServices(providerId: string): Promise<Service[]> {
    return db.select().from(services)
      .where(and(eq(services.providerId, providerId), eq(services.isActive, true)));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Bookings
  async getBookings(customerId: string): Promise<(Booking & { provider?: { businessName: string } })[]> {
    const bookingList = await db.select().from(bookings)
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));
    
    const result = await Promise.all(
      bookingList.map(async (booking) => {
        const provider = await this.getServiceProvider(booking.providerId);
        return { ...booking, provider: provider ? { businessName: provider.businessName } : undefined };
      })
    );
    
    return result;
  }

  async getBooking(id: string): Promise<(Booking & { provider?: ServiceProvider; service?: Service }) | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    if (!booking) return undefined;
    
    const provider = await this.getServiceProvider(booking.providerId);
    const service = booking.serviceId ? await this.getService(booking.serviceId) : undefined;
    
    return { ...booking, provider, service };
  }

  async getBookingsByProvider(providerId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.providerId, providerId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingByStripeSession(sessionId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.stripeSessionId, sessionId));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async updateBookingStatus(id: string, status: string, data?: Partial<InsertBooking>): Promise<Booking | undefined> {
    const updateData = { status: status as any, updatedAt: new Date(), ...data };
    const [updated] = await db.update(bookings).set(updateData).where(eq(bookings.id, id)).returning();
    return updated;
  }

  // Service Reviews
  async getServiceReviewsByProvider(providerId: string): Promise<ServiceReview[]> {
    return db.select().from(serviceReviews)
      .where(eq(serviceReviews.providerId, providerId))
      .orderBy(desc(serviceReviews.createdAt));
  }

  async getServiceReviewByBooking(bookingId: string): Promise<ServiceReview | undefined> {
    const [review] = await db.select().from(serviceReviews).where(eq(serviceReviews.bookingId, bookingId));
    return review;
  }

  async createServiceReview(review: InsertServiceReview): Promise<ServiceReview> {
    const [created] = await db.insert(serviceReviews).values(review).returning();
    await this.updateProviderRating(review.providerId);
    return created;
  }

  async updateProviderRating(providerId: string): Promise<void> {
    const providerReviews = await this.getServiceReviewsByProvider(providerId);
    if (providerReviews.length === 0) return;
    
    const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    await db.update(serviceProviders)
      .set({ rating: avgRating.toFixed(1), reviewCount: providerReviews.length })
      .where(eq(serviceProviders.id, providerId));
  }

  // Messages
  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ))
      .orderBy(messages.createdAt);
  }

  async getConversations(userId: string): Promise<{ partnerId: string; lastMessage: Message }[]> {
    const allMessages = await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
    
    const conversationsMap = new Map<string, Message>();
    
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, msg);
      }
    }
    
    return Array.from(conversationsMap.entries()).map(([partnerId, lastMessage]) => ({
      partnerId,
      lastMessage
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async markMessagesRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  // Events (Community Hub)
  async getEvents(category?: string): Promise<Event[]> {
    if (category) {
      return db.select().from(events)
        .where(and(eq(events.category, category), eq(events.isApproved, true)))
        .orderBy(events.eventDate);
    }
    return db.select().from(events)
      .where(eq(events.isApproved, true))
      .orderBy(events.eventDate);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getUpcomingEvents(): Promise<Event[]> {
    return db.select().from(events)
      .where(and(
        eq(events.isApproved, true),
        sql`${events.eventDate} >= NOW()`
      ))
      .orderBy(events.eventDate)
      .limit(10);
  }

  async getFeaturedEvents(): Promise<Event[]> {
    return db.select().from(events)
      .where(and(
        eq(events.isApproved, true),
        eq(events.isFeatured, true),
        sql`${events.eventDate} >= NOW()`
      ))
      .orderBy(events.eventDate)
      .limit(5);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Event RSVPs
  async getEventRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined> {
    const [rsvp] = await db.select().from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    return rsvp;
  }

  async createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [created] = await db.insert(eventRsvps).values(rsvp).returning();
    // Update attendee count
    await db.update(events)
      .set({ attendeeCount: sql`${events.attendeeCount} + 1` })
      .where(eq(events.id, rsvp.eventId));
    return created;
  }

  async updateEventRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp | undefined> {
    const [updated] = await db.update(eventRsvps)
      .set({ status: status as any })
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .returning();
    return updated;
  }

  async getEventAttendees(eventId: string): Promise<EventRsvp[]> {
    return db.select().from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going")));
  }

  // Businesses (Community Hub)
  async getBusinesses(category?: string): Promise<Business[]> {
    if (category) {
      return db.select().from(businesses)
        .where(and(eq(businesses.category, category), eq(businesses.isActive, true)))
        .orderBy(businesses.name);
    }
    return db.select().from(businesses)
      .where(eq(businesses.isActive, true))
      .orderBy(businesses.name);
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async searchBusinesses(query: string, category?: string): Promise<Business[]> {
    const searchPattern = `%${query}%`;
    if (category) {
      return db.select().from(businesses)
        .where(and(
          eq(businesses.isActive, true),
          eq(businesses.category, category),
          or(
            ilike(businesses.name, searchPattern),
            ilike(businesses.description, searchPattern)
          )
        ))
        .orderBy(businesses.name);
    }
    return db.select().from(businesses)
      .where(and(
        eq(businesses.isActive, true),
        or(
          ilike(businesses.name, searchPattern),
          ilike(businesses.description, searchPattern)
        )
      ))
      .orderBy(businesses.name);
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [created] = await db.insert(businesses).values(business).returning();
    return created;
  }

  async updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [updated] = await db.update(businesses).set(data).where(eq(businesses.id, id)).returning();
    return updated;
  }

  async deleteBusiness(id: string): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  // Announcements (Community Hub)
  async getAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements)
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements)
      .where(and(
        eq(announcements.isActive, true),
        or(
          sql`${announcements.expiresAt} IS NULL`,
          sql`${announcements.expiresAt} > NOW()`
        )
      ))
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [created] = await db.insert(announcements).values(announcement).returning();
    return created;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [updated] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async incrementAnnouncementViews(id: string): Promise<void> {
    await db.update(announcements)
      .set({ viewCount: sql`${announcements.viewCount} + 1` })
      .where(eq(announcements.id, id));
  }

  // Admin Methods
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalRestaurants: number;
    totalOrders: number;
    totalProviders: number;
    totalBookings: number;
    totalEvents: number;
    totalBusinesses: number;
    revenue: number;
  }> {
    const [restaurantCount] = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [providerCount] = await db.select({ count: sql<number>`count(*)` }).from(serviceProviders);
    const [bookingCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(events);
    const [businessCount] = await db.select({ count: sql<number>`count(*)` }).from(businesses);
    const [userCount] = await db.select({ count: sql<number>`count(DISTINCT user_id)` }).from(userRoles);
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(total::numeric), 0)` }).from(orders);
    
    return {
      totalUsers: Number(userCount?.count || 0),
      totalRestaurants: Number(restaurantCount?.count || 0),
      totalOrders: Number(orderCount?.count || 0),
      totalProviders: Number(providerCount?.count || 0),
      totalBookings: Number(bookingCount?.count || 0),
      totalEvents: Number(eventCount?.count || 0),
      totalBusinesses: Number(businessCount?.count || 0),
      revenue: Number(revenueResult?.total || 0),
    };
  }

  async getAllUsers(): Promise<{ id: string; email: string; firstName: string; lastName: string; roles: string[] }[]> {
    const allRoles = await db.select().from(userRoles).orderBy(desc(userRoles.createdAt));
    const userMap = new Map<string, { id: string; email: string; firstName: string; lastName: string; roles: string[] }>();
    
    for (const role of allRoles) {
      if (!userMap.has(role.userId)) {
        userMap.set(role.userId, {
          id: role.userId,
          email: "",
          firstName: "",
          lastName: "",
          roles: [],
        });
      }
      userMap.get(role.userId)!.roles.push(role.role);
    }
    
    return Array.from(userMap.values());
  }

  async getUserById(id: string): Promise<{ id: string; email: string; firstName: string; lastName: string; roles: string[] } | undefined> {
    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, id));
    if (roles.length === 0) return undefined;
    
    return {
      id,
      email: "",
      firstName: "",
      lastName: "",
      roles: roles.map(r => r.role),
    };
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async addUserRole(userId: string, role: string): Promise<UserRole> {
    const [created] = await db.insert(userRoles).values({ userId, role: role as any }).returning();
    return created;
  }

  async removeUserRole(userId: string, role: string): Promise<void> {
    await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
  }

  async getAllOrders(): Promise<(Order & { restaurant?: { name: string } })[]> {
    const [orderList, allRestaurants] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(restaurants),
    ]);
    const restaurantMap = new Map(allRestaurants.map(r => [r.id, r.name]));
    return orderList.map((order) => ({
      ...order,
      restaurant: restaurantMap.has(order.restaurantId) ? { name: restaurantMap.get(order.restaurantId)! } : undefined,
    }));
  }

  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getAllEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getAllBusinesses(): Promise<Business[]> {
    return db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getAllServiceProviders(): Promise<ServiceProvider[]> {
    return db.select().from(serviceProviders).orderBy(desc(serviceProviders.createdAt));
  }

  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async getAllServiceReviews(): Promise<ServiceReview[]> {
    return db.select().from(serviceReviews).orderBy(desc(serviceReviews.createdAt));
  }

  async deleteServiceReview(id: string): Promise<void> {
    await db.delete(serviceReviews).where(eq(serviceReviews.id, id));
  }

  async deleteRestaurant(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.restaurantId, id));
    await db.delete(restaurants).where(eq(restaurants.id, id));
  }

  async deleteServiceProvider(id: string): Promise<void> {
    await db.delete(services).where(eq(services.providerId, id));
    await db.delete(serviceProviders).where(eq(serviceProviders.id, id));
  }

  // Push Tokens (Mobile)
  async getPushTokens(userId: string): Promise<PushToken[]> {
    return db.select().from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));
  }

  async getPushTokenByToken(token: string): Promise<PushToken | undefined> {
    const [existing] = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
    return existing;
  }

  async registerPushToken(data: InsertPushToken): Promise<PushToken> {
    const existing = await this.getPushTokenByToken(data.token);
    if (existing) {
      const [updated] = await db.update(pushTokens)
        .set({ userId: data.userId, isActive: true, platform: data.platform, deviceId: data.deviceId, updatedAt: new Date() })
        .where(eq(pushTokens.token, data.token))
        .returning();
      return updated;
    }
    const [created] = await db.insert(pushTokens).values(data).returning();
    return created;
  }

  async deactivatePushToken(token: string): Promise<void> {
    await db.update(pushTokens).set({ isActive: false, updatedAt: new Date() }).where(eq(pushTokens.token, token));
  }

  async deactivateUserPushTokens(userId: string): Promise<void> {
    await db.update(pushTokens).set({ isActive: false, updatedAt: new Date() }).where(eq(pushTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();
