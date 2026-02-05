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

1. **User Authentication**: Replit Auth with Google, GitHub, email login
2. **Food Ordering**: Browse restaurants, view menus, add to cart, checkout
3. **Order Tracking**: Real-time order status updates
4. **Vendor Portal**: Manage restaurant, menu items, process orders
5. **Reviews**: Rate and review orders after delivery
6. **Notifications**: Order updates and system notifications

## Database Schema

- **users**: User accounts (managed by Replit Auth)
- **sessions**: Auth sessions
- **restaurants**: Restaurant profiles
- **menu_items**: Menu items for each restaurant
- **orders**: Customer orders with status tracking
- **reviews**: Customer reviews for orders
- **notifications**: User notifications

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

### Vendor
- `GET /api/vendor/restaurants` - Get vendor's restaurants
- `POST /api/vendor/restaurants` - Create restaurant
- `PATCH /api/vendor/restaurants/:id` - Update restaurant
- `GET /api/vendor/restaurants/:id/menu` - Get menu items
- `POST /api/vendor/restaurants/:id/menu` - Add menu item
- `GET /api/vendor/restaurants/:id/orders` - Get restaurant orders
- `PATCH /api/vendor/orders/:id` - Update order status

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

Database is automatically seeded with sample Brazilian restaurants on first run.

## Development Notes

- Use `npm run db:push` to sync database schema
- Cart state persists in localStorage
- Theme (light/dark) persists in localStorage
- All protected routes require Replit Auth login
