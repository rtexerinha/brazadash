import { 
  restaurants, menuItems, orders, reviews, notifications, userRoles,
  serviceProviders, services, bookings, serviceReviews, messages,
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
  type Message, type InsertMessage
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
}

export const storage = new DatabaseStorage();
