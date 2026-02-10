import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { 
  insertOrderSchema, insertReviewSchema, insertRestaurantSchema, insertMenuItemSchema,
  insertServiceProviderSchema, insertServiceSchema, insertBookingSchema, insertServiceReviewSchema, insertMessageSchema,
  insertPushTokenSchema, serviceCategories
} from "@shared/schema";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uploadStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = crypto.randomBytes(16).toString("hex");
      cb(null, `${name}${ext}`);
    },
  });

  const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"));
      }
    },
  });

  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  app.post("/api/upload", isAuthenticated, upload.single("image"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

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

  const isApprovedVendor = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const roles = await storage.getUserRoles(userId);
    const vendorRole = roles.find(r => r.role === "vendor");
    if (!vendorRole || vendorRole.approvalStatus !== "approved") {
      return res.status(403).json({ error: "Your vendor account is pending approval" });
    }
    next();
  };

  const isApprovedProvider = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const roles = await storage.getUserRoles(userId);
    const providerRole = roles.find(r => r.role === "service_provider");
    if (!providerRole || providerRole.approvalStatus !== "approved") {
      return res.status(403).json({ error: "Your service provider account is pending approval" });
    }
    next();
  };

  // Get vendor's restaurants
  app.get("/api/vendor/restaurants", isAuthenticated, isApprovedVendor, async (req: any, res) => {
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
  app.post("/api/vendor/restaurants", isAuthenticated, isApprovedVendor, async (req: any, res) => {
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
  app.patch("/api/vendor/restaurants/:id", isAuthenticated, isApprovedVendor, async (req: any, res) => {
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
  app.get("/api/vendor/restaurants/:id/menu", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const menuItems = await storage.getMenuItems(req.params.id);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // Add menu item
  app.post("/api/vendor/restaurants/:id/menu", isAuthenticated, isApprovedVendor, async (req: any, res) => {
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
  app.get("/api/vendor/restaurants/:id/orders", isAuthenticated, isApprovedVendor, async (req: any, res) => {
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
  app.patch("/api/vendor/orders/:id", isAuthenticated, isApprovedVendor, async (req: any, res) => {
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
  app.get("/api/provider/profile", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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
  app.post("/api/provider/profile", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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
  app.patch("/api/provider/profile", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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
  app.get("/api/provider/services", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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
  app.post("/api/provider/services", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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
  app.get("/api/provider/bookings", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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
  app.patch("/api/provider/bookings/:id", isAuthenticated, isApprovedProvider, async (req: any, res) => {
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

  // =================
  // STRIPE PAYMENT ROUTES
  // =================

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  // Create PaymentIntent for embedded card form
  app.post("/api/checkout/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, restaurantId, deliveryAddress, notes, tip } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      if (!deliveryAddress || deliveryAddress.trim().length < 5) {
        return res.status(400).json({ message: "Delivery address is required" });
      }

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      let subtotal = 0;
      const itemDetails: any[] = [];

      for (const item of items) {
        const menuItem = await storage.getMenuItem(item.menuItemId);
        if (!menuItem) {
          return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
        }
        const itemTotal = parseFloat(menuItem.price) * item.quantity;
        subtotal += itemTotal;
        itemDetails.push({
          menuItemId: item.menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
        });
      }

      const deliveryFee = restaurant.deliveryFee ? parseFloat(restaurant.deliveryFee) : 3.99;
      const tipAmount = tip ? parseFloat(tip) : 0;
      const platformFee = Math.round(subtotal * 0.08 * 100) / 100;
      const total = subtotal + deliveryFee + tipAmount + platformFee;
      const amountInCents = Math.round(total * 100);

      const stripe = await getUncachableStripeClient();

      const descriptorSuffix = (restaurant.businessName || 'Order')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .substring(0, 22)
        .trim();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        statement_descriptor: 'BRAZADASH',
        statement_descriptor_suffix: descriptorSuffix,
        metadata: {
          userId,
          restaurantId,
          deliveryAddress,
          notes: notes || '',
          items: JSON.stringify(itemDetails),
          tip: tipAmount.toString(),
          subtotal: subtotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          platformFee: platformFee.toFixed(2),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm payment and create order
  app.post("/api/checkout/confirm-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      if (paymentIntent.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const existingOrder = await storage.getOrderByStripeSession(paymentIntentId);
      if (existingOrder) {
        return res.json(existingOrder);
      }

      const items = JSON.parse(paymentIntent.metadata?.items || '[]');
      const total = paymentIntent.amount / 100;
      const tipAmount = parseFloat(paymentIntent.metadata?.tip || '0');
      const deliveryFee = parseFloat(paymentIntent.metadata?.deliveryFee || '3.99');
      const subtotal = parseFloat(paymentIntent.metadata?.subtotal || '0');

      const order = await storage.createOrder({
        customerId: userId,
        restaurantId: paymentIntent.metadata?.restaurantId || '',
        items,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        tip: tipAmount.toFixed(2),
        total: total.toFixed(2),
        deliveryAddress: paymentIntent.metadata?.deliveryAddress || '',
        notes: paymentIntent.metadata?.notes || '',
        stripeSessionId: paymentIntentId,
      });

      await storage.createNotification({
        userId,
        title: "Order Placed",
        message: `Your order #${order.id.slice(0, 8)} has been placed successfully!`,
        type: "order",
      });

      res.json(order);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Create checkout session for food order (legacy redirect)
  app.post("/api/checkout/create-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, restaurantId, deliveryAddress, notes, tip } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      if (!deliveryAddress || deliveryAddress.trim().length < 5) {
        return res.status(400).json({ message: "Delivery address is required" });
      }

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Calculate totals
      let subtotal = 0;
      const lineItems = [];

      for (const item of items) {
        const menuItem = await storage.getMenuItem(item.menuItemId);
        if (!menuItem) {
          return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
        }

        const itemTotal = parseFloat(menuItem.price) * item.quantity;
        subtotal += itemTotal;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: menuItem.name,
              description: menuItem.description || undefined,
            },
            unit_amount: Math.round(parseFloat(menuItem.price) * 100),
          },
          quantity: item.quantity,
        });
      }

      // Add delivery fee
      const deliveryFee = restaurant.deliveryFee ? parseFloat(restaurant.deliveryFee) : 3.99;
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery Fee',
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });

      // Add platform fee (8%)
      const platformFee = Math.round(subtotal * 0.08 * 100) / 100;
      if (platformFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Platform Fee',
              description: 'Platform fee (8%)',
            },
            unit_amount: Math.round(platformFee * 100),
          },
          quantity: 1,
        });
      }

      // Add tip if provided
      const tipAmount = tip ? parseFloat(tip) : 0;
      if (tipAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tip',
            },
            unit_amount: Math.round(tipAmount * 100),
          },
          quantity: 1,
        });
      }

      const stripe = await getUncachableStripeClient();

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout`,
        metadata: {
          userId,
          restaurantId,
          deliveryAddress,
          notes: notes || '',
          items: JSON.stringify(items),
          tip: tipAmount.toString(),
          platformFee: platformFee.toFixed(2),
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Handle successful payment - create order
  app.post("/api/checkout/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Verify user matches
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Check if order already created for this session
      const existingOrder = await storage.getOrderByStripeSession(sessionId);
      if (existingOrder) {
        return res.json(existingOrder);
      }

      // Create order from session metadata
      const items = JSON.parse(session.metadata?.items || '[]');
      const total = session.amount_total ? session.amount_total / 100 : 0;
      const tipAmount = parseFloat(session.metadata?.tip || '0');
      
      // Calculate subtotal and delivery fee from total
      const deliveryFee = 3.99;
      const subtotal = total - deliveryFee - tipAmount;

      const order = await storage.createOrder({
        customerId: userId,
        restaurantId: session.metadata?.restaurantId || '',
        items,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        tip: tipAmount.toFixed(2),
        total: total.toFixed(2),
        deliveryAddress: session.metadata?.deliveryAddress || '',
        notes: session.metadata?.notes || '',
        stripeSessionId: sessionId,
      });

      // Create notification
      await storage.createNotification({
        userId,
        title: "Order Placed",
        message: `Your order #${order.id.slice(0, 8)} has been placed successfully!`,
        type: "order",
      });

      res.json(order);
    } catch (error) {
      console.error("Error completing checkout:", error);
      res.status(500).json({ message: "Failed to complete checkout" });
    }
  });

  // Get checkout session status
  app.get("/api/checkout/session/:sessionId", isAuthenticated, async (req: any, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      
      res.json({
        status: session.payment_status,
        customerEmail: session.customer_email,
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // ============================================
  // BOOKING CHECKOUT (Stripe payment for services)
  // ============================================

  const PLATFORM_FEE_PERCENT = 0.08; // 8% platform fee

  app.post("/api/bookings/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { providerId, serviceId, requestedDate, requestedTime, address, notes } = req.body;

      if (!providerId) {
        return res.status(400).json({ message: "Provider ID is required" });
      }

      const provider = await storage.getServiceProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      let serviceName = provider.businessName;
      let servicePrice = 0;

      if (serviceId) {
        const service = await storage.getService(serviceId);
        if (!service) {
          return res.status(404).json({ message: "Service not found" });
        }
        serviceName = service.name;
        servicePrice = parseFloat(service.price || "0");
      }

      const providerBookingFee = parseFloat(provider.bookingFee || "0");
      const platformFee = Math.round(servicePrice * PLATFORM_FEE_PERCENT * 100) / 100;
      const totalBookingFee = providerBookingFee + platformFee;
      const totalAmount = servicePrice + totalBookingFee;

      if (totalAmount <= 0) {
        return res.status(400).json({ message: "No amount to charge. Service price or booking fee must be set." });
      }

      const stripe = await getUncachableStripeClient();

      const lineItems: any[] = [];

      if (servicePrice > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: serviceName,
              description: `Service by ${provider.businessName}`,
            },
            unit_amount: Math.round(servicePrice * 100),
          },
          quantity: 1,
        });
      }

      if (platformFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Platform Fee',
              description: 'Platform fee (8%)',
            },
            unit_amount: Math.round(platformFee * 100),
          },
          quantity: 1,
        });
      }

      if (providerBookingFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Booking Fee',
              description: `Reservation fee set by ${provider.businessName}`,
            },
            unit_amount: Math.round(providerBookingFee * 100),
          },
          quantity: 1,
        });
      }

      const bookingDescriptorSuffix = (provider.businessName || 'Booking')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .substring(0, 22)
        .trim();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        payment_intent_data: {
          statement_descriptor: 'BRAZADASH',
          statement_descriptor_suffix: bookingDescriptorSuffix,
        },
        success_url: `${req.protocol}://${req.get('host')}/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/services/provider/${providerId}`,
        metadata: {
          type: 'booking',
          userId,
          providerId,
          serviceId: serviceId || '',
          serviceName,
          servicePrice: servicePrice.toString(),
          bookingFee: totalBookingFee.toString(),
          platformFee: platformFee.toString(),
          providerBookingFee: providerBookingFee.toString(),
          totalAmount: totalAmount.toString(),
          requestedDate: requestedDate || '',
          requestedTime: requestedTime || '',
          address: address || '',
          notes: notes || '',
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating booking checkout:", error);
      res.status(500).json({ message: "Failed to create booking checkout session" });
    }
  });

  app.post("/api/bookings/checkout/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (session.metadata?.type !== 'booking') {
        return res.status(400).json({ message: "Invalid session type" });
      }

      const existingBooking = await storage.getBookingByStripeSession(sessionId);
      if (existingBooking) {
        return res.json(existingBooking);
      }

      const booking = await storage.createBooking({
        customerId: userId,
        providerId: session.metadata.providerId,
        serviceId: session.metadata.serviceId || null,
        requestedDate: session.metadata.requestedDate ? new Date(session.metadata.requestedDate) : null,
        requestedTime: session.metadata.requestedTime || null,
        address: session.metadata.address || null,
        notes: session.metadata.notes || null,
        price: session.metadata.servicePrice || '0',
        bookingFee: session.metadata.bookingFee || '0',
        totalPaid: session.metadata.totalAmount || '0',
        stripeSessionId: sessionId,
        isPaid: true,
        status: 'pending',
      });

      const provider = await storage.getServiceProvider(booking.providerId);
      if (provider) {
        await storage.createNotification({
          userId: provider.userId,
          title: "New Paid Booking",
          message: `New booking request for ${session.metadata.serviceName} on ${new Date(session.metadata.requestedDate || '').toLocaleDateString()}. Payment received.`,
          type: "booking",
        });
      }

      await storage.createNotification({
        userId,
        title: "Booking Confirmed",
        message: `Your booking for ${session.metadata.serviceName} has been placed. Payment of $${parseFloat(session.metadata.totalAmount || '0').toFixed(2)} received.`,
        type: "booking",
      });

      res.json(booking);
    } catch (error) {
      console.error("Error completing booking checkout:", error);
      res.status(500).json({ message: "Failed to complete booking checkout" });
    }
  });

  // ============================================
  // COMMUNITY HUB ROUTES (EPIC 6)
  // ============================================

  // Events - Public
  app.get("/api/community/events", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const events = await storage.getEvents(category);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/community/events/upcoming", async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/community/events/featured", async (req, res) => {
    try {
      const events = await storage.getFeaturedEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching featured events:", error);
      res.status(500).json({ message: "Failed to fetch featured events" });
    }
  });

  app.get("/api/community/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Events - Protected (RSVP)
  app.post("/api/community/events/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;
      const { status } = req.body;

      const existing = await storage.getEventRsvp(eventId, userId);
      if (existing) {
        const updated = await storage.updateEventRsvp(eventId, userId, status);
        return res.json(updated);
      }

      const rsvp = await storage.createEventRsvp({
        eventId,
        userId,
        status: status || "going",
      });
      res.json(rsvp);
    } catch (error) {
      console.error("Error RSVPing to event:", error);
      res.status(500).json({ message: "Failed to RSVP" });
    }
  });

  app.get("/api/community/events/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rsvp = await storage.getEventRsvp(req.params.id, userId);
      res.json(rsvp || null);
    } catch (error) {
      console.error("Error fetching RSVP:", error);
      res.status(500).json({ message: "Failed to fetch RSVP" });
    }
  });

  // Businesses - Public
  app.get("/api/community/businesses", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      
      let businesses;
      if (search) {
        businesses = await storage.searchBusinesses(search, category);
      } else {
        businesses = await storage.getBusinesses(category);
      }
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/community/businesses/:id", async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  // Yellow Pages - Public
  app.get("/api/community/yellow-pages", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const city = req.query.city as string | undefined;
      const search = req.query.search as string | undefined;
      const listings = await storage.getYellowPages(category, city, search);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching yellow pages:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/community/yellow-pages/cities", async (req, res) => {
    try {
      const cities = await storage.getYellowPageCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.get("/api/community/yellow-pages/categories", async (req, res) => {
    res.json([
      { id: "room", name: "Room" },
      { id: "shared-room", name: "Shared Room" },
      { id: "house", name: "House" },
      { id: "apartment", name: "Apartment" },
      { id: "car", name: "Car" },
      { id: "other", name: "Other" },
    ]);
  });

  app.get("/api/community/yellow-pages/:id", async (req, res) => {
    try {
      const listing = await storage.getYellowPage(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  // Yellow Pages - User submission (requires auth)
  app.post("/api/community/yellow-pages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await storage.createYellowPage({
        ...req.body,
        createdBy: userId,
        isApproved: false,
        isActive: true,
      });
      res.status(201).json(listing);
    } catch (error) {
      console.error("Error creating yellow page listing:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  // Events - User submission (requires auth)
  app.post("/api/community/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = { ...req.body };
      if (eventData.eventDate && typeof eventData.eventDate === "string") {
        eventData.eventDate = new Date(eventData.eventDate);
      }
      if (eventData.endDate && typeof eventData.endDate === "string") {
        eventData.endDate = new Date(eventData.endDate);
      }
      const event = await storage.createEvent({
        ...eventData,
        createdBy: userId,
        isApproved: false,
        isFeatured: false,
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Announcements - Public
  app.get("/api/community/announcements", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get("/api/community/announcements/:id", async (req, res) => {
    try {
      const announcement = await storage.getAnnouncement(req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      // Increment view count
      await storage.incrementAnnouncementViews(req.params.id);
      res.json(announcement);
    } catch (error) {
      console.error("Error fetching announcement:", error);
      res.status(500).json({ message: "Failed to fetch announcement" });
    }
  });

  // Event categories
  app.get("/api/community/event-categories", (req, res) => {
    const categories = [
      { id: "festival", name: "Festivals", icon: "party-popper" },
      { id: "concert", name: "Concerts", icon: "music" },
      { id: "meetup", name: "Meetups", icon: "users" },
      { id: "sports", name: "Sports", icon: "dumbbell" },
      { id: "cultural", name: "Cultural", icon: "landmark" },
      { id: "food", name: "Food Events", icon: "utensils" },
      { id: "workshop", name: "Workshops", icon: "graduation-cap" },
      { id: "other", name: "Other", icon: "calendar" },
    ];
    res.json(categories);
  });

  // Business categories
  app.get("/api/community/business-categories", (req, res) => {
    const categories = [
      { id: "restaurant", name: "Restaurants", icon: "utensils" },
      { id: "grocery", name: "Grocery Stores", icon: "shopping-cart" },
      { id: "beauty", name: "Beauty & Spa", icon: "sparkles" },
      { id: "fitness", name: "Fitness", icon: "dumbbell" },
      { id: "auto", name: "Auto Services", icon: "car" },
      { id: "legal", name: "Legal Services", icon: "scale" },
      { id: "real-estate", name: "Real Estate", icon: "home" },
      { id: "education", name: "Education", icon: "graduation-cap" },
      { id: "healthcare", name: "Healthcare", icon: "heart-pulse" },
      { id: "retail", name: "Retail", icon: "shopping-bag" },
      { id: "professional", name: "Professional Services", icon: "briefcase" },
      { id: "other", name: "Other", icon: "building" },
    ];
    res.json(categories);
  });

  // ============================================
  // USER ROLE ROUTES
  // ============================================

  app.get("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const roles = await storage.getUserRoles(userId);
      const roleNames = roles.map(r => r.role);

      const adminEmail = process.env.ADMIN_EMAIL;
      const userEmail = req.user?.claims?.email;
      if (adminEmail && userEmail && adminEmail.toLowerCase() === userEmail.toLowerCase()) {
        if (!roleNames.includes("admin")) {
          await storage.addUserRole(userId, "admin");
          roleNames.push("admin");
        }
      }

      const approvalMap: Record<string, string> = {};
      for (const r of roles) {
        approvalMap[r.role] = r.approvalStatus || "approved";
      }

      res.json({ roles: roleNames, approvalStatus: approvalMap });
    } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ error: "Failed to fetch user role" });
    }
  });

  app.post("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { role, businessInfo } = req.body;
      const validRoles = ["customer", "vendor", "service_provider"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be: customer, vendor, or service_provider" });
      }

      const existingRoles = await storage.getUserRoles(userId);
      const nonAdminRoles = existingRoles.filter(r => r.role !== "admin");
      if (nonAdminRoles.length > 0) {
        return res.status(400).json({ error: "Role already assigned. Contact admin to change." });
      }

      const approvalStatus = role === "customer" ? "approved" : "pending";
      const created = await storage.addUserRole(userId, role);
      if (approvalStatus === "pending") {
        await storage.updateUserRoleApproval(userId, role, "pending");
      }

      if (role === "vendor" && businessInfo) {
        const existingRestaurants = await storage.getRestaurantsByOwner(userId);
        const existing = existingRestaurants.length > 0 ? existingRestaurants[0] : null;
        if (!existing) {
          await storage.createRestaurant({
            ownerId: userId,
            name: businessInfo.name || "Unnamed Restaurant",
            description: businessInfo.description || null,
            cuisine: businessInfo.cuisine || null,
            address: businessInfo.address || null,
            city: businessInfo.city || null,
            phone: businessInfo.phone || null,
            bankName: businessInfo.bankName || null,
            routingNumber: businessInfo.routingNumber || null,
            bankAccountNumber: businessInfo.bankAccountNumber || null,
            zelleInfo: businessInfo.zelleInfo || null,
            venmoInfo: businessInfo.venmoInfo || null,
            isActive: false,
          });
        }
      }

      if (role === "service_provider" && businessInfo) {
        const existing = await storage.getServiceProviderByUser(userId);
        if (!existing) {
          await storage.createServiceProvider({
            userId: userId,
            businessName: businessInfo.businessName || "Unnamed Business",
            description: businessInfo.description || null,
            category: businessInfo.category || "other",
            address: businessInfo.address || null,
            city: businessInfo.city || null,
            phone: businessInfo.phone || null,
            email: businessInfo.email || null,
            einNumber: businessInfo.einNumber || null,
            imageUrl: businessInfo.imageUrl || null,
            bankName: businessInfo.bankName || null,
            routingNumber: businessInfo.routingNumber || null,
            bankAccountNumber: businessInfo.bankAccountNumber || null,
            zelleInfo: businessInfo.zelleInfo || null,
            venmoInfo: businessInfo.venmoInfo || null,
            isActive: false,
          });
        }
      }

      const allRoles = await storage.getUserRoles(userId);
      const approvalMap: Record<string, string> = {};
      for (const r of allRoles) {
        approvalMap[r.role] = r.approvalStatus || "approved";
      }

      res.json({ roles: allRoles.map(r => r.role), approvalStatus: approvalMap });
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ error: "Failed to set user role" });
    }
  });

  // ============================================
  // ADMIN PLATFORM ROUTES (EPIC 9)
  // ============================================

  app.get("/api/user/is-admin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ isAdmin: false });
      }
      const roles = await storage.getUserRoles(userId);
      const isAdmin = roles.some(r => r.role === "admin");
      res.json({ isAdmin });
    } catch (error) {
      res.json({ isAdmin: false });
    }
  });

  // Admin middleware - checks if user has admin role
  const isAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const roles = await storage.getUserRoles(userId);
    if (!roles.some(r => r.role === "admin")) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // Admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // User management - list all users
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // User management - get user details
  app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // User management - update user roles
  app.patch("/api/admin/users/:id/roles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role, action } = req.body;
      if (action === "add") {
        await storage.addUserRole(req.params.id, role);
      } else if (action === "remove") {
        await storage.removeUserRole(req.params.id, role);
      }
      const roles = await storage.getUserRoles(req.params.id);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user roles" });
    }
  });

  // Pending approvals management
  app.get("/api/admin/pending-approvals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pending = await storage.getPendingApprovals();
      const enriched = await Promise.all(pending.map(async (p) => {
        const user = await storage.getUserById(p.userId);
        let businessInfo: Record<string, any> | null = null;

        if (p.role === "vendor") {
          const restaurants = await storage.getRestaurantsByOwner(p.userId);
          if (restaurants.length > 0) {
            const r = restaurants[0];
            businessInfo = {
              name: r.name,
              description: r.description,
              cuisine: r.cuisine,
              city: r.city,
              address: r.address,
              phone: r.phone,
            };
          }
        } else if (p.role === "service_provider") {
          const provider = await storage.getServiceProviderByUser(p.userId);
          if (provider) {
            businessInfo = {
              businessName: provider.businessName,
              description: provider.description,
              category: provider.category,
              city: provider.city,
              address: provider.address,
              phone: provider.phone,
              email: provider.email,
            };
          }
        }

        return {
          ...p,
          userName: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
          userEmail: user?.email || "",
          businessInfo,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  app.patch("/api/admin/approve-role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, role, status } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      const updated = await storage.updateUserRoleApproval(userId, role, status);
      if (!updated) {
        return res.status(404).json({ error: "Role not found" });
      }

      if (status === "approved") {
        if (role === "vendor") {
          const restaurants = await storage.getRestaurantsByOwner(userId);
          if (restaurants.length > 0 && !restaurants[0].isActive) {
            await storage.updateRestaurant(restaurants[0].id, { isActive: true });
          }
        } else if (role === "service_provider") {
          const provider = await storage.getServiceProviderByUser(userId);
          if (provider && !provider.isActive) {
            await storage.updateServiceProvider(provider.id, { isActive: true });
          }
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update approval status" });
    }
  });

  // Restaurant management
  app.get("/api/admin/restaurants", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allRestaurants = await storage.getAllRestaurants();
      res.json(allRestaurants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  });

  app.patch("/api/admin/restaurants/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isActive, isOpen } = req.body;
      const updated = await storage.updateRestaurant(req.params.id, { isActive, isOpen });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update restaurant" });
    }
  });

  // Service provider management
  app.get("/api/admin/providers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const providers = await storage.getAllServiceProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  app.patch("/api/admin/providers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isActive, isVerified } = req.body;
      const updated = await storage.updateServiceProvider(req.params.id, { isActive, isVerified });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update provider" });
    }
  });

  // Orders management
  app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Bookings management
  app.get("/api/admin/bookings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      res.json(allBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Events management
  app.get("/api/admin/events", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allEvents = await storage.getAllEvents();
      res.json(allEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.patch("/api/admin/events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isApproved, isFeatured } = req.body;
      const updated = await storage.updateEvent(req.params.id, { isApproved, isFeatured });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Businesses management
  app.get("/api/admin/businesses", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allBusinesses = await storage.getAllBusinesses();
      res.json(allBusinesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.patch("/api/admin/businesses/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isActive, isVerified } = req.body;
      const updated = await storage.updateBusiness(req.params.id, { isActive, isVerified });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update business" });
    }
  });

  // Announcements management
  app.get("/api/admin/announcements", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allAnnouncements = await storage.getAllAnnouncements();
      res.json(allAnnouncements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/admin/announcements", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const announcement = await storage.createAnnouncement({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.patch("/api/admin/announcements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updated = await storage.updateAnnouncement(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/admin/announcements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Yellow Pages management
  app.get("/api/admin/yellow-pages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allListings = await storage.getAllYellowPages();
      res.json(allListings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch yellow pages" });
    }
  });

  app.patch("/api/admin/yellow-pages/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isApproved, isActive } = req.body;
      const updated = await storage.updateYellowPage(req.params.id, { isApproved, isActive });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  app.delete("/api/admin/yellow-pages/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteYellowPage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  // Reviews management
  app.get("/api/admin/reviews", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.delete("/api/admin/reviews/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteReview(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  app.get("/api/admin/service-reviews", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAllServiceReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service reviews" });
    }
  });

  app.delete("/api/admin/service-reviews/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteServiceReview(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service review" });
    }
  });

  app.delete("/api/admin/restaurants/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteRestaurant(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete restaurant" });
    }
  });

  app.delete("/api/admin/providers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteServiceProvider(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });

  app.delete("/api/admin/events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.delete("/api/admin/businesses/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteBusiness(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete business" });
    }
  });

  // =================
  // ADMIN FINANCIAL REPORT
  // =================

  app.get("/api/admin/financial-report", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const PLATFORM_FEE_RATE = 0.08;

      let rangeStart: Date;
      let rangeEnd: Date;

      if (req.query.startDate && req.query.endDate) {
        rangeStart = new Date(req.query.startDate as string);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(req.query.endDate as string);
        rangeEnd.setHours(23, 59, 59, 999);
      } else {
        const weekOffset = parseInt(req.query.weekOffset as string || "0");
        const now = new Date();
        const currentDay = now.getDay();
        rangeStart = new Date(now);
        rangeStart.setDate(now.getDate() - currentDay + (weekOffset * 7));
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(rangeStart);
        rangeEnd.setDate(rangeStart.getDate() + 6);
        rangeEnd.setHours(23, 59, 59, 999);
      }

      const rangeEndExclusive = new Date(rangeEnd);
      rangeEndExclusive.setMilliseconds(rangeEndExclusive.getMilliseconds() + 1);

      const numDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const allOrders = await storage.getAllOrders();
      const allBookings = await storage.getAllBookings();
      const allRestaurants = await storage.getAllRestaurants();
      const allProviders = await storage.getAllServiceProviders();

      const periodOrders = allOrders.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt) : null;
        return d && d >= rangeStart && d < rangeEndExclusive && o.status !== "cancelled";
      });

      const periodBookings = allBookings.filter(b => {
        const d = b.createdAt ? new Date(b.createdAt) : null;
        return d && d >= rangeStart && d < rangeEndExclusive && b.isPaid && b.status !== "cancelled";
      });

      const restaurantReports = allRestaurants.map(r => {
        const rOrders = periodOrders.filter(o => o.restaurantId === r.id);
        const dailyBreakdown = Array.from({ length: numDays }, (_, i) => {
          const dayDate = new Date(rangeStart);
          dayDate.setDate(rangeStart.getDate() + i);
          const dayEnd = new Date(dayDate);
          dayEnd.setDate(dayDate.getDate() + 1);

          const dayOrders = rOrders.filter(o => {
            const d = new Date(o.createdAt!);
            return d >= dayDate && d < dayEnd;
          });

          const grossRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.subtotal || "0"), 0);
          const platformFee = Math.round(grossRevenue * PLATFORM_FEE_RATE * 100) / 100;
          const netPayout = Math.round((grossRevenue - platformFee) * 100) / 100;

          return {
            day: dayNames[dayDate.getDay()],
            date: dayDate.toISOString().split("T")[0],
            orders: dayOrders.length,
            grossRevenue: Math.round(grossRevenue * 100) / 100,
            platformFee,
            netPayout,
          };
        });

        const totalGross = dailyBreakdown.reduce((s, d) => s + d.grossRevenue, 0);
        const totalPlatformFee = dailyBreakdown.reduce((s, d) => s + d.platformFee, 0);
        const totalNet = dailyBreakdown.reduce((s, d) => s + d.netPayout, 0);
        const totalOrders = dailyBreakdown.reduce((s, d) => s + d.orders, 0);

        return {
          type: "restaurant" as const,
          id: r.id,
          name: r.name,
          totalOrders,
          grossRevenue: Math.round(totalGross * 100) / 100,
          platformFee: Math.round(totalPlatformFee * 100) / 100,
          netPayout: Math.round(totalNet * 100) / 100,
          dailyBreakdown,
        };
      }).filter(r => r.totalOrders > 0 || true);

      const providerReports = allProviders.map(p => {
        const pBookings = periodBookings.filter(b => b.providerId === p.id);
        const dailyBreakdown = Array.from({ length: numDays }, (_, i) => {
          const dayDate = new Date(rangeStart);
          dayDate.setDate(rangeStart.getDate() + i);
          const dayEnd = new Date(dayDate);
          dayEnd.setDate(dayDate.getDate() + 1);

          const dayBookings = pBookings.filter(b => {
            const d = new Date(b.createdAt!);
            return d >= dayDate && d < dayEnd;
          });

          const serviceRevenue = dayBookings.reduce((sum, b) => sum + parseFloat(b.price || "0"), 0);
          const bookingFeeRevenue = dayBookings.reduce((sum, b) => sum + parseFloat(b.bookingFee || "0"), 0);
          const totalPaid = dayBookings.reduce((sum, b) => sum + parseFloat(b.totalPaid || "0"), 0);
          const platformFee = Math.round(serviceRevenue * PLATFORM_FEE_RATE * 100) / 100;
          const netPayout = Math.round((serviceRevenue + bookingFeeRevenue - platformFee) * 100) / 100;

          return {
            day: dayNames[dayDate.getDay()],
            date: dayDate.toISOString().split("T")[0],
            bookings: dayBookings.length,
            serviceRevenue: Math.round(serviceRevenue * 100) / 100,
            bookingFeeRevenue: Math.round(bookingFeeRevenue * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            platformFee,
            netPayout,
          };
        });

        const totalServiceRev = dailyBreakdown.reduce((s, d) => s + d.serviceRevenue, 0);
        const totalBookingFeeRev = dailyBreakdown.reduce((s, d) => s + d.bookingFeeRevenue, 0);
        const totalPlatformFee = dailyBreakdown.reduce((s, d) => s + d.platformFee, 0);
        const totalNet = dailyBreakdown.reduce((s, d) => s + d.netPayout, 0);
        const totalBookings = dailyBreakdown.reduce((s, d) => s + d.bookings, 0);
        const totalPaidAmount = dailyBreakdown.reduce((s, d) => s + d.totalPaid, 0);

        return {
          type: "provider" as const,
          id: p.id,
          name: p.businessName,
          totalBookings,
          serviceRevenue: Math.round(totalServiceRev * 100) / 100,
          bookingFeeRevenue: Math.round(totalBookingFeeRev * 100) / 100,
          totalPaid: Math.round(totalPaidAmount * 100) / 100,
          platformFee: Math.round(totalPlatformFee * 100) / 100,
          netPayout: Math.round(totalNet * 100) / 100,
          dailyBreakdown,
        };
      }).filter(p => p.totalBookings > 0 || true);

      const startStr = rangeStart.toISOString().split("T")[0];
      const endStr = rangeEnd.toISOString().split("T")[0];

      const totalPlatformRevenue = 
        restaurantReports.reduce((s, r) => s + r.platformFee, 0) +
        providerReports.reduce((s, p) => s + p.platformFee, 0);

      const totalPayouts =
        restaurantReports.reduce((s, r) => s + r.netPayout, 0) +
        providerReports.reduce((s, p) => s + p.netPayout, 0);

      res.json({
        weekStart: startStr,
        weekEnd: endStr,
        weekOffset: 0,
        restaurants: restaurantReports,
        providers: providerReports,
        summary: {
          totalPlatformRevenue: Math.round(totalPlatformRevenue * 100) / 100,
          totalPayouts: Math.round(totalPayouts * 100) / 100,
          totalOrders: periodOrders.length,
          totalBookings: periodBookings.length,
        },
      });
    } catch (error) {
      console.error("Error generating financial report:", error);
      res.status(500).json({ error: "Failed to generate financial report" });
    }
  });

  // =================
  // MOBILE API ROUTES
  // =================

  // Register push notification token
  app.post("/api/mobile/push-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPushTokenSchema.safeParse({
        ...req.body,
        userId,
        isActive: true,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid push token data", errors: parsed.error.flatten().fieldErrors });
      }

      const existing = await storage.getPushTokenByToken(parsed.data.token);
      const pushToken = await storage.registerPushToken(parsed.data);

      res.status(existing ? 200 : 201).json(pushToken);
    } catch (error) {
      console.error("Error registering push token:", error);
      res.status(500).json({ message: "Failed to register push token" });
    }
  });

  // Deactivate push notification token (logout/uninstall)
  app.delete("/api/mobile/push-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const existing = await storage.getPushTokenByToken(token);
      if (existing && existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deactivatePushToken(token);
      res.status(204).send();
    } catch (error) {
      console.error("Error deactivating push token:", error);
      res.status(500).json({ message: "Failed to deactivate push token" });
    }
  });

  // Mobile user profile - returns user data with roles, stats, and active tokens
  app.get("/api/mobile/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = req.user.claims;

      const [roles, ordersList, bookingsList, pushTokensList] = await Promise.all([
        storage.getUserRoles(userId),
        storage.getOrders(userId),
        storage.getBookings(userId),
        storage.getPushTokens(userId),
      ]);

      res.json({
        id: userId,
        email: claims.email || null,
        firstName: claims.first_name || null,
        lastName: claims.last_name || null,
        profileImageUrl: claims.profile_image_url || null,
        roles: roles.map((r) => r.role),
        stats: {
          totalOrders: ordersList.length,
          totalBookings: bookingsList.length,
          activeDevices: pushTokensList.length,
        },
      });
    } catch (error) {
      console.error("Error fetching mobile profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Mobile home feed - combined data for the mobile app home screen
  app.get("/api/mobile/home", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const [
        restaurantsList,
        upcomingEvents,
        activeAnnouncements,
        notificationsList,
        featuredProviders,
      ] = await Promise.all([
        storage.getRestaurants(),
        storage.getUpcomingEvents(),
        storage.getActiveAnnouncements(),
        storage.getNotifications(userId),
        storage.getServiceProviders(),
      ]);

      const unreadNotifications = notificationsList.filter((n) => !n.isRead).length;

      res.json({
        restaurants: restaurantsList.slice(0, 6),
        upcomingEvents: upcomingEvents.slice(0, 5),
        announcements: activeAnnouncements.slice(0, 3),
        featuredProviders: featuredProviders.slice(0, 6),
        unreadNotifications,
      });
    } catch (error) {
      console.error("Error fetching mobile home:", error);
      res.status(500).json({ message: "Failed to fetch home feed" });
    }
  });

  // ===================== STRIPE TERMINAL ENDPOINTS =====================

  app.post("/api/terminal/connection-token", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const connectionToken = await stripe.terminal.connectionTokens.create();
      res.json({ secret: connectionToken.secret });
    } catch (error: any) {
      console.error("Error creating connection token:", error);
      res.status(500).json({ message: "Failed to create connection token" });
    }
  });

  app.post("/api/terminal/locations", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { restaurantId } = req.body;
      if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (restaurant.terminalLocationId) {
        return res.json({ locationId: restaurant.terminalLocationId });
      }

      const stripe = await getUncachableStripeClient();
      const location = await stripe.terminal.locations.create({
        display_name: restaurant.name,
        address: {
          line1: restaurant.address || "Address not set",
          city: restaurant.city || "Unknown",
          state: "CA",
          country: "US",
          postal_code: "00000",
        },
      });

      await storage.updateRestaurant(restaurantId, {
        terminalLocationId: location.id,
        terminalEnabled: true,
      });

      res.json({ locationId: location.id });
    } catch (error: any) {
      console.error("Error creating terminal location:", error);
      res.status(500).json({ message: "Failed to create terminal location" });
    }
  });

  app.get("/api/terminal/readers", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { restaurantId } = req.query;
      if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });

      const restaurant = await storage.getRestaurant(restaurantId as string);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!restaurant.terminalLocationId) {
        return res.json({ readers: [] });
      }

      const stripe = await getUncachableStripeClient();
      const readers = await stripe.terminal.readers.list({
        location: restaurant.terminalLocationId,
        limit: 100,
      });

      res.json({
        readers: readers.data.map((r: any) => ({
          id: r.id,
          label: r.label,
          deviceType: r.device_type,
          status: r.status,
          serialNumber: r.serial_number,
          ipAddress: r.ip_address,
        })),
      });
    } catch (error: any) {
      console.error("Error listing readers:", error);
      res.status(500).json({ message: "Failed to list readers" });
    }
  });

  app.post("/api/terminal/payment-intents", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { restaurantId, amount, description } = req.body;

      if (!restaurantId || !amount) {
        return res.status(400).json({ message: "restaurantId and amount are required" });
      }

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!restaurant.terminalEnabled) {
        return res.status(400).json({ message: "Terminal is not enabled for this restaurant" });
      }

      const amountCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountCents) || amountCents < 50) {
        return res.status(400).json({ message: "Amount must be at least $0.50" });
      }

      const platformFee = Math.round(amountCents * 0.08);

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        payment_method_types: ["card_present"],
        capture_method: "manual",
        statement_descriptor: "BRAZADASH ORDER",
        metadata: {
          restaurantId,
          restaurantName: restaurant.name,
          type: "terminal_in_person",
          description: description || "In-person payment",
          platformFee: platformFee.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountCents,
        platformFee,
      });
    } catch (error: any) {
      console.error("Error creating terminal payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/terminal/payment-intents/:id/capture", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const paymentIntentId = req.params.id;

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      const restaurantId = paymentIntent.metadata?.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ message: "Invalid payment intent" });
      }

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const captured = await stripe.paymentIntents.capture(paymentIntentId);

      res.json({
        status: captured.status,
        amount: captured.amount,
        id: captured.id,
      });
    } catch (error: any) {
      console.error("Error capturing payment:", error);
      res.status(500).json({ message: "Failed to capture payment" });
    }
  });

  app.patch("/api/terminal/settings", isAuthenticated, isApprovedVendor, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { restaurantId, terminalEnabled } = req.body;

      if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateRestaurant(restaurantId, {
        terminalEnabled: !!terminalEnabled,
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating terminal settings:", error);
      res.status(500).json({ message: "Failed to update terminal settings" });
    }
  });

  return httpServer;
}
