# BrazaDash

A Brazilian community marketplace platform serving the Brazilian community in California. Enables users to discover and order authentic Brazilian food, find Brazilian services, and connect with the community.

## Project Overview

**Purpose**: Mobile-first marketplace combining food delivery (DoorDash-style), services marketplace (Thumbtack-style), and community directory features.

**Target Users**:
- Customers: Brazilian residents seeking authentic food and Portuguese-speaking services
- Vendors: Brazilian restaurants, home-based cooks, food trucks
- Service Providers: Cleaning, beauty, legal, construction, and more

## Tech Stack

- **Frontend**: React + TypeScript with Vite, Wouter for routing, TanStack Query for data fetching
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: Tailwind CSS with shadcn/ui components

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (cart context, query client)
│   │   └── pages/          # Page components
│   └── public/images/      # Generated images for the app
├── server/                 # Express backend
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── seed.ts             # Seed data for restaurants
│   └── replit_integrations/auth/  # Replit Auth integration
└── shared/                 # Shared types and schemas
    └── schema.ts           # Drizzle schema definitions
```

## Key Features (MVP)

### Food Marketplace
1. **User Authentication**: Replit Auth with Google, GitHub, email login
2. **Food Ordering**: Browse restaurants, view menus, add to cart, checkout
3. **Order Tracking**: Real-time order status updates
4. **Vendor Portal**: Manage restaurant, menu items, process orders
5. **Reviews**: Rate and review orders after delivery
6. **Notifications**: Order updates and system notifications

### Services Marketplace (Epic 4)
1. **Service Discovery**: Browse 11 service categories (cleaning, beauty, legal, fitness, auto, immigration, education, construction, photography, translation, other)
2. **Provider Profiles**: View provider details, services offered, reviews, ratings
3. **Booking System**: Request service bookings with date/time/location
4. **Provider Portal**: Manage services, respond to bookings, track status
5. **Service Reviews**: Rate completed services with detailed feedback
6. **Messaging**: In-app messaging between customers and providers

## Database Schema

### Core Tables
- **users**: User accounts (managed by Replit Auth)
- **sessions**: Auth sessions
- **user_roles**: User role assignments (customer, vendor, service_provider, admin)
- **notifications**: User notifications

### Food Marketplace Tables
- **restaurants**: Restaurant profiles
- **menu_items**: Menu items for each restaurant
- **orders**: Customer food orders with status tracking
- **reviews**: Customer reviews for food orders

### Services Marketplace Tables
- **service_providers**: Service provider profiles with category, location, rating
- **services**: Individual services offered by each provider with pricing
- **bookings**: Service booking requests with status tracking (pending, accepted, declined, confirmed, in_progress, completed, cancelled)
- **service_reviews**: Customer reviews for completed service bookings
- **messages**: In-app messaging between users (supports booking-linked conversations)

## API Endpoints

### Public
- `GET /api/restaurants` - List all restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `GET /api/restaurants/:id/menu` - Get restaurant menu
- `GET /api/restaurants/:id/reviews` - Get restaurant reviews

### Protected (requires auth)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `POST /api/reviews` - Submit review
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id` - Mark notification as read

### Restaurant Vendor Portal
- `GET /api/vendor/restaurants` - Get vendor's restaurants
- `POST /api/vendor/restaurants` - Create restaurant
- `PATCH /api/vendor/restaurants/:id` - Update restaurant
- `GET /api/vendor/restaurants/:id/menu` - Get menu items
- `POST /api/vendor/restaurants/:id/menu` - Add menu item
- `GET /api/vendor/restaurants/:id/orders` - Get restaurant orders
- `PATCH /api/vendor/orders/:id` - Update order status

### Services Marketplace (Public)
- `GET /api/services/categories` - List all service categories
- `GET /api/services/providers` - List providers (query: category, search)
- `GET /api/services/providers/:id` - Get provider details
- `GET /api/services/providers/:id/services` - Get provider's services
- `GET /api/services/providers/:id/reviews` - Get provider's reviews

### Services Marketplace (Protected)
- `GET /api/bookings` - Get user's service bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking request
- `POST /api/services/reviews` - Submit service review

### Service Provider Portal
- `GET /api/provider/profile` - Get provider profile
- `POST /api/provider/profile` - Create provider profile
- `PATCH /api/provider/profile` - Update provider profile
- `GET /api/provider/services` - Get provider's services
- `POST /api/provider/services` - Add new service
- `GET /api/provider/bookings` - Get provider's bookings
- `PATCH /api/provider/bookings/:id` - Update booking status

### Messaging
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/:partnerId` - Get conversation with user
- `POST /api/messages` - Send message

## Design System

**Colors**: Brazilian flag inspired theme
- Primary: Green (#1B9B59)
- Secondary: Yellow/Gold (#FFCC00)
- Accent: Blue (#006B3F)

**Fonts**: Plus Jakarta Sans for clean, modern typography

## Running the App

The app runs on port 5000 with:
- Express API server
- Vite dev server for React frontend

Database is automatically seeded with sample Brazilian restaurants and service providers on first run.

## Frontend Routes

### Food Marketplace
- `/` - Home/Dashboard
- `/restaurants` - Browse restaurants
- `/restaurant/:id` - Restaurant detail with menu
- `/cart` - Shopping cart
- `/checkout` - Order checkout
- `/orders` - Order history
- `/orders/:id` - Order details
- `/vendor` - Restaurant vendor portal

### Services Marketplace
- `/services` - Browse service providers (filterable by category)
- `/services/provider/:id` - Provider detail with services
- `/bookings` - User's service bookings
- `/bookings/:id` - Booking details
- `/provider-portal` - Service provider portal

### General
- `/notifications` - User notifications

## Development Notes

- Use `npm run db:push` to sync database schema
- Cart state persists in localStorage
- Theme (light/dark) persists in localStorage
- All protected routes require Replit Auth login
