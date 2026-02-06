import { Switch, Route, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import HomePage from "@/pages/home";
import RestaurantsPage from "@/pages/restaurants";
import RestaurantDetailPage from "@/pages/restaurant-detail";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import CheckoutSuccessPage from "@/pages/checkout-success";
import OrdersPage from "@/pages/orders";
import OrderDetailPage from "@/pages/order-detail";
import VendorPage from "@/pages/vendor";
import NotificationsPage from "@/pages/notifications";
import ServicesPage from "@/pages/services";
import ProviderDetailPage from "@/pages/provider-detail";
import BookingsPage from "@/pages/bookings";
import BookingDetailPage from "@/pages/booking-detail";
import ProviderPortalPage from "@/pages/provider-portal";
import CommunityPage from "@/pages/community";
import EventsPage from "@/pages/events";
import BusinessesPage from "@/pages/businesses";
import AdminPage from "@/pages/admin";

function RoleBasedHome({ roles }: { roles: string[] }) {
  if (roles.includes("vendor")) {
    return <Redirect to="/vendor" />;
  }
  if (roles.includes("service_provider")) {
    return <Redirect to="/provider-portal" />;
  }
  return <HomePage />;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const { data: roleData, isLoading: rolesLoading } = useQuery<{ roles: string[] }>({
    queryKey: ["/api/user/role"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || (isAuthenticated && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-primary-foreground">B</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  const roles = roleData?.roles || [];
  const hasNonAdminRole = roles.some(r => r !== "admin");

  if (!hasNonAdminRole) {
    return <OnboardingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/">
          <RoleBasedHome roles={roles} />
        </Route>
        <Route path="/restaurants" component={RestaurantsPage} />
        <Route path="/restaurant/:id" component={RestaurantDetailPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/checkout/success" component={CheckoutSuccessPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/orders/:id" component={OrderDetailPage} />
        <Route path="/vendor" component={VendorPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/services/provider/:id" component={ProviderDetailPage} />
        <Route path="/bookings" component={BookingsPage} />
        <Route path="/bookings/:id" component={BookingDetailPage} />
        <Route path="/provider-portal" component={ProviderPortalPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/businesses" component={BusinessesPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
