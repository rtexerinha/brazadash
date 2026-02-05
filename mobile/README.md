# BrazaDash Mobile App

React Native (Expo) mobile app for the BrazaDash Brazilian community marketplace.

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS App Store / Google Play Store)

## Getting Started

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Scan the QR code with:
   - **iOS**: Camera app or Expo Go
   - **Android**: Expo Go app

## Project Structure

```
mobile/
├── App.tsx                    # Root component
├── src/
│   ├── api/client.ts          # API client (connects to brazadash.replit.app)
│   ├── components/            # Reusable components
│   │   ├── EmptyState.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── StarRating.tsx
│   │   └── StatusBadge.tsx
│   ├── constants/
│   │   ├── categories.ts      # Service/event categories
│   │   └── theme.ts           # Colors, spacing, typography
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── CartContext.tsx     # Shopping cart state
│   ├── navigation/
│   │   └── index.tsx           # Tab + stack navigation
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Home feed with featured content
│   │   ├── RestaurantsScreen.tsx
│   │   ├── RestaurantDetailScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── CheckoutScreen.tsx
│   │   ├── ServicesScreen.tsx
│   │   ├── ProviderDetailScreen.tsx
│   │   ├── CommunityScreen.tsx # Events, businesses, announcements
│   │   ├── OrdersScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── LoginScreen.tsx     # WebView OIDC auth
│   └── types/
│       └── index.ts            # TypeScript interfaces
```

## Features

### Home Tab
- Welcome hero with Brazilian flag colors
- Featured restaurants carousel
- Top service providers
- Upcoming community events
- Platform announcements

### Food Tab
- Search and browse restaurants
- View menus, add to cart
- Cart with quantity management
- Checkout with delivery address and tip
- Order history with status tracking

### Services Tab
- Browse by 11 categories with icon filters
- Search service providers
- Provider detail with services list
- Booking request system
- Booking history

### Community Tab
- Events browser with category filters
- Business directory with search
- Platform announcements and news

### Profile Tab
- User profile with stats
- Order and booking history
- Notifications center
- Sign in / sign out

## API Connection

The app connects to the BrazaDash API at `https://brazadash.replit.app`.
Authentication uses Replit Auth (OIDC) via a WebView login flow.

## Building for Production

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

You'll need an Expo account and EAS CLI (`npm install -g eas-cli`).

## Theme

- Primary Green: #1B9B59
- Secondary Yellow: #FFCC00
- Accent Blue: #006B3F

The design follows the Brazilian flag color scheme consistent with the web app.
