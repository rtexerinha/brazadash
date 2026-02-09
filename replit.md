# BrazaDash

## Overview

BrazaDash is a mobile-first community marketplace platform designed to serve the Brazilian community in California. It aims to be a comprehensive hub for authentic Brazilian food delivery, various Brazilian services, and community connection. The project combines features similar to DoorDash, Thumbtack, and a local community directory, fostering cultural connection and economic activity within the Brazilian diaspora.

## User Preferences

I prefer clear, actionable instructions and direct communication. When proposing changes, please outline the problem, potential solutions, and your recommended approach before implementation. For code, I appreciate well-structured, readable code with comments where complexity warrants. Focus on delivering iterative improvements and communicate progress regularly.

## System Architecture

The BrazaDash platform is built with a modern full-stack architecture:

-   **Frontend**: A React and TypeScript application, using Vite for fast development, Wouter for routing, and TanStack Query for efficient data fetching. Styling is managed with Tailwind CSS and pre-built shadcn/ui components, ensuring a consistent and responsive user experience.
-   **Backend**: An Express.js server written in TypeScript, handling API requests and business logic.
-   **Database**: PostgreSQL is used as the primary data store, with Drizzle ORM providing a type-safe interface for database interactions.
-   **Authentication**: Replit Auth (OpenID Connect) manages user authentication and authorization, supporting various login methods.
-   **Payments**: Stripe is integrated for secure and reliable payment processing.
-   **Monorepo Structure**: The project is organized into `client/`, `server/`, and `shared/` directories to promote code reusability and maintainability.
-   **User Role System**: A robust role-based access control system differentiates between Customers, Vendors (Restaurants), Service Providers, and Admins, dynamically adjusting UI and API access based on the user's assigned role.
-   **UI/UX Design**: The application features a clean, modern design with a Brazilian flag-inspired color scheme (Primary: Green, Secondary: Yellow/Gold, Accent: Blue) and uses Plus Jakarta Sans for typography to ensure readability and a professional appearance.
-   **Mobile Application**: A companion React Native mobile app built with Expo SDK 51 provides a native mobile experience, mirroring the web platform's features and design, including persistent cart state via AsyncStorage and push notifications.

-   **Bilingual System**: Full English/Portuguese translation system using React Context (`client/src/lib/language-context.tsx`) with a flag toggle component (`client/src/components/language-toggle.tsx`). Language preference persisted to `localStorage` with key `brazadash-lang`. The `useLanguage()` hook provides `t()` function for translations and `language` for the current language code. All major pages use `t()` calls for user-facing text.

**Core Features Implemented:**

-   **Home Page**: Language-aware hero section, popular services, featured providers and restaurants, customer testimonials, and food categories.
-   **Food Marketplace**: User authentication, food ordering, order tracking, vendor portal for menu and order management, and a robust review system with photo uploads and detailed ratings. Menu items support quantity/availability tracking (quantity field: -1=unlimited, 0=out of stock, >0=limited). Items with 0 quantity display "Item Not Available" to customers. Vendors can upload images from their computer (multer-based upload to /uploads/ directory, max 5MB, JPEG/PNG/WebP/GIF). Order status progression: pending → confirmed → preparing → ready → out_for_delivery → delivered (or cancelled), with customer notifications at each stage.
-   **Services Marketplace**: Service discovery across various categories, detailed provider profiles, a booking system, a provider portal for managing services and bookings, and service-specific reviews.
-   **Community Hub**: Discovery of local events with RSVP functionality, a business directory for Brazilian-owned businesses, and platform-wide announcements.
-   **Admin Platform**: Comprehensive dashboard for managing users, restaurants, service providers, orders, bookings, events, businesses, and platform announcements, including content moderation.
-   **Admin Approval Workflow**: Vendors and service providers require admin approval before operating. Customers are auto-approved. Admin dashboard has a dedicated "Approvals" tab with badge count for pending registrations. Users pending approval see a dedicated `/pending-approval` page. Server-side middleware (`isApprovedVendor`/`isApprovedProvider`) protects all vendor/provider API routes. The `user_roles` table has an `approvalStatus` column (approved/pending/rejected).

## External Dependencies

-   **Replit Auth**: For user authentication and authorization.
-   **PostgreSQL**: The relational database management system.
-   **Stripe**: For payment processing.
-   **Octokit**: For GitHub integration (likely for version control or API interaction).
-   **Expo**: For building and running the React Native mobile application.
-   **Vite**: Frontend build tool.
-   **Wouter**: Frontend routing library.
-   **TanStack Query**: For data fetching and state management.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **shadcn/ui**: Component library.