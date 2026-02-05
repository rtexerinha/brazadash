import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { 
  insertOrderSchema, insertReviewSchema, insertRestaurantSchema, insertMenuItemSchema,
  insertServiceProviderSchema, insertServiceSchema, insertBookingSchema, insertServiceReviewSchema, insertMessageSchema,
  serviceCategories
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // =================
  // PUBLIC ROUTES
  // =================

  // Get all restaurants
  app.get("/api/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // Get single restaurant
  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  // Get restaurant menu
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems(req.params.id);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // Get restaurant reviews
  app.get("/api/restaurants/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByRestaurant(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // =================
  // PROTECTED ROUTES
  // =================

  // Get user orders
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Verify user owns this order
      if (order.customerId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Create order
  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Prepare order data with customerId
      const orderData = {
        ...req.body,
        customerId: userId,
      };
      
      // Validate with Zod schema
      const validationResult = insertOrderSchema.safeParse(orderData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      // Additional business validation
      const { items, deliveryAddress } = validationResult.data;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain at least one item" });
      }
      
      if (!deliveryAddress || deliveryAddress.trim().length < 5) {
        return res.status(400).json({ message: "Delivery address is required" });
      }
      
      const order = await storage.createOrder(validationResult.data);
      
      // Create notification for customer
      await storage.createNotification({
        userId,
        title: "Order Placed",
        message: `Your order #${order.id.slice(0, 8)} has been placed successfully!`,
        type: "order",
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Create review
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Prepare review data with customerId
      const reviewData = {
        ...req.body,
        customerId: userId,
      };
      
      // Validate with Zod schema
      const validationResult = insertReviewSchema.safeParse(reviewData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const { orderId, rating } = validationResult.data;
      
      // Additional business validation for rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      // Verify user owns the order
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Verify order is delivered
      if (order.status !== "delivered") {
        return res.status(400).json({ message: "Can only review delivered orders" });
      }
      
      // Check if already reviewed
      const existingReview = await storage.getReviewByOrder(orderId);
      if (existingReview) {
        return res.status(400).json({ message: "Order already reviewed" });
      }
      
      const review = await storage.createReview(validationResult.data);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  // =================
  // VENDOR ROUTES
  // =================

  // Get vendor's restaurants
  app.get("/api/vendor/restaurants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurants = await storage.getRestaurantsByOwner(userId);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching vendor restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // Create restaurant
  app.post("/api/vendor/restaurants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Prepare restaurant data with ownerId
      const restaurantData = {
        ...req.body,
        ownerId: userId,
      };
      
      // Validate with Zod schema
      const validationResult = insertRestaurantSchema.safeParse(restaurantData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const restaurant = await storage.createRestaurant(validationResult.data);
      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  // Update restaurant
  app.patch("/api/vendor/restaurants/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await storage.getRestaurant(req.params.id);
      
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate update fields using partial schema
      const updateSchema = insertRestaurantSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const updated = await storage.updateRestaurant(req.params.id, validationResult.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  // Get vendor's restaurant menu
  app.get("/api/vendor/restaurants/:id/menu", isAuthenticated, async (req: any, res) => {
    try {
      const menuItems = await storage.getMenuItems(req.params.id);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // Add menu item
  app.post("/api/vendor/restaurants/:id/menu", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await storage.getRestaurant(req.params.id);
      
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Prepare menu item data with restaurantId
      const menuItemData = {
        ...req.body,
        restaurantId: req.params.id,
      };
      
      // Validate with Zod schema
      const validationResult = insertMenuItemSchema.safeParse(menuItemData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const menuItem = await storage.createMenuItem(validationResult.data);
      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  // Get vendor's restaurant orders
  app.get("/api/vendor/restaurants/:id/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await storage.getRestaurant(req.params.id);
      
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const orders = await storage.getOrdersByRestaurant(req.params.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status (vendor)
  app.patch("/api/vendor/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.body;
      
      // Validate status value
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const restaurant = await storage.getRestaurant(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updated = await storage.updateOrderStatus(req.params.id, status);
      
      // Notify customer
      const statusMessages: Record<string, string> = {
        confirmed: "Your order has been confirmed!",
        preparing: "Your order is being prepared.",
        ready: "Your order is ready for pickup!",
        out_for_delivery: "Your order is out for delivery!",
        delivered: "Your order has been delivered. Enjoy!",
        cancelled: "Your order has been cancelled.",
      };
      
      if (statusMessages[status]) {
        await storage.createNotification({
          userId: order.customerId,
          title: `Order #${order.id.slice(0, 8)} Update`,
          message: statusMessages[status],
          type: "order",
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // =================
  // SERVICES MARKETPLACE ROUTES
  // =================

  // Get service categories
  app.get("/api/services/categories", async (req, res) => {
    res.json(serviceCategories);
  });

  // Get all service providers (with optional category filter)
  app.get("/api/services/providers", async (req, res) => {
    try {
      const { category, search } = req.query;
      let providers;
      
      if (search && typeof search === "string") {
        providers = await storage.searchServiceProviders(search, category as string | undefined);
      } else {
        providers = await storage.getServiceProviders(category as string | undefined);
      }
      
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Get single provider
  app.get("/api/services/providers/:id", async (req, res) => {
    try {
      const provider = await storage.getServiceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Get provider's services
  app.get("/api/services/providers/:id/services", async (req, res) => {
    try {
      const services = await storage.getServices(req.params.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get provider's reviews
  app.get("/api/services/providers/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getServiceReviewsByProvider(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // =====================
  // PROTECTED SERVICES ROUTES
  // =====================

  // Get user's bookings
  app.get("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get single booking
  app.get("/api/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const booking = await storage.getBooking(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify user owns the booking or is the provider
      const provider = await storage.getServiceProviderByUser(userId);
      if (booking.customerId !== userId && (!provider || provider.id !== booking.providerId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Create booking request
  app.post("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const bookingData = {
        ...req.body,
        customerId: userId,
      };
      
      const validationResult = insertBookingSchema.safeParse(bookingData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const booking = await storage.createBooking(validationResult.data);
      
      // Notify provider
      const provider = await storage.getServiceProvider(booking.providerId);
      if (provider) {
        await storage.createNotification({
          userId: provider.userId,
          title: "New Booking Request",
          message: `You have a new booking request for ${new Date(booking.requestedDate || "").toLocaleDateString()}`,
          type: "booking",
        });
      }
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Create service review
  app.post("/api/services/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const reviewData = {
        ...req.body,
        customerId: userId,
      };
      
      const validationResult = insertServiceReviewSchema.safeParse(reviewData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const { bookingId, rating } = validationResult.data;
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      // Verify user owns the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.customerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "Can only review completed bookings" });
      }
      
      // Check if already reviewed
      const existingReview = await storage.getServiceReviewByBooking(bookingId);
      if (existingReview) {
        return res.status(400).json({ message: "Booking already reviewed" });
      }
      
      const review = await storage.createServiceReview(validationResult.data);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // =====================
  // MESSAGES ROUTES
  // =====================

  // Get conversations list
  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get conversation with specific user
  app.get("/api/messages/:partnerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getConversation(userId, req.params.partnerId);
      
      // Mark messages as read
      await storage.markMessagesRead(req.params.partnerId, userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const messageData = {
        ...req.body,
        senderId: userId,
      };
      
      const validationResult = insertMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const message = await storage.createMessage(validationResult.data);
      
      // Notify receiver
      await storage.createNotification({
        userId: message.receiverId,
        title: "New Message",
        message: "You have a new message",
        type: "message",
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // =====================
  // PROVIDER PORTAL ROUTES
  // =====================

  // Get current user's provider profile
  app.get("/api/provider/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getServiceProviderByUser(userId);
      res.json(provider || null);
    } catch (error) {
      console.error("Error fetching provider profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Create provider profile
  app.post("/api/provider/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if already has a profile
      const existing = await storage.getServiceProviderByUser(userId);
      if (existing) {
        return res.status(400).json({ message: "Profile already exists" });
      }
      
      const providerData = {
        ...req.body,
        userId,
      };
      
      const validationResult = insertServiceProviderSchema.safeParse(providerData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const provider = await storage.createServiceProvider(validationResult.data);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(500).json({ message: "Failed to create provider" });
    }
  });

  // Update provider profile
  app.patch("/api/provider/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getServiceProviderByUser(userId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const updateSchema = insertServiceProviderSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const updated = await storage.updateServiceProvider(provider.id, validationResult.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Get provider's services
  app.get("/api/provider/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getServiceProviderByUser(userId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const services = await storage.getServices(provider.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Add service
  app.post("/api/provider/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getServiceProviderByUser(userId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const serviceData = {
        ...req.body,
        providerId: provider.id,
      };
      
      const validationResult = insertServiceSchema.safeParse(serviceData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }
      
      const service = await storage.createService(validationResult.data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Get provider's bookings
  app.get("/api/provider/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getServiceProviderByUser(userId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const bookings = await storage.getBookingsByProvider(provider.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Update booking status (provider)
  app.patch("/api/provider/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getServiceProviderByUser(userId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const booking = await storage.getBooking(req.params.id);
      if (!booking || booking.providerId !== provider.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { status, confirmedDate, confirmedTime, price } = req.body;
      
      const validStatuses = ["pending", "accepted", "declined", "confirmed", "in_progress", "completed", "cancelled"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      
      const updated = await storage.updateBookingStatus(req.params.id, status, { 
        confirmedDate, 
        confirmedTime,
        price 
      });
      
      // Notify customer
      const statusMessages: Record<string, string> = {
        accepted: "Your booking request has been accepted!",
        declined: "Your booking request was declined.",
        confirmed: "Your booking is confirmed!",
        in_progress: "Your service is in progress.",
        completed: "Your service has been completed. Please leave a review!",
        cancelled: "Your booking has been cancelled.",
      };
      
      if (statusMessages[status]) {
        await storage.createNotification({
          userId: booking.customerId,
          title: `Booking Update`,
          message: statusMessages[status],
          type: "booking",
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  return httpServer;
}
