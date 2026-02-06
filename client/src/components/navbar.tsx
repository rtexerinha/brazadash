import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/components/theme-provider";
import { ShoppingCart, Sun, Moon, LogOut, Store, Bell, Briefcase, Calendar, Shield } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { getItemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = getItemCount();

  const { data: roleData } = useQuery<{ roles: string[] }>({
    queryKey: ["/api/user/role"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const roles = roleData?.roles || [];
  const isAdmin = roles.includes("admin");
  const isVendor = roles.includes("vendor");
  const isProvider = roles.includes("service_provider");
  const isCustomer = roles.includes("customer");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <span className="text-xl font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">Braza</span>
              <span>Dash</span>
            </span>
          </div>
        </Link>

        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            {isVendor && (
              <Link href="/vendor">
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    location === "/vendor" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="link-vendor-dashboard"
                >
                  My Restaurant
                </span>
              </Link>
            )}

            {isProvider && (
              <Link href="/provider-portal">
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    location === "/provider-portal" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="link-provider-dashboard"
                >
                  My Services
                </span>
              </Link>
            )}

            {isCustomer && (
              <Link href="/">
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="link-home"
                >
                  Home
                </span>
              </Link>
            )}

            <Link href="/restaurants">
              <span
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  location.startsWith("/restaurant") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="link-restaurants"
              >
                Food
              </span>
            </Link>
            <Link href="/services">
              <span
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  location.startsWith("/services") || location.startsWith("/bookings") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="link-services"
              >
                Services
              </span>
            </Link>
            <Link href="/community">
              <span
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  location.startsWith("/community") || location.startsWith("/events") || location.startsWith("/businesses") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="link-community"
              >
                Community
              </span>
            </Link>
            {isCustomer && (
              <Link href="/orders">
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    location === "/orders" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="link-orders"
                >
                  My Orders
                </span>
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated && (
            <>
              {(isCustomer || isVendor) && (
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              <Link href="/notifications">
                <Button variant="ghost" size="icon" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.firstName && (
                        <p className="font-medium" data-testid="text-user-name">
                          {user.firstName} {user.lastName}
                        </p>
                      )}
                      {user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground" data-testid="text-user-email">
                          {user.email}
                        </p>
                      )}
                      <Badge variant="outline" className="w-fit text-xs mt-1" data-testid="badge-user-role">
                        {isVendor ? "Restaurant Vendor" : isProvider ? "Service Provider" : "Customer"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {isVendor && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor" className="cursor-pointer" data-testid="link-vendor-portal">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Restaurant Portal</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isProvider && (
                    <DropdownMenuItem asChild>
                      <Link href="/provider-portal" className="cursor-pointer" data-testid="link-provider-portal">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Service Provider Portal</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isCustomer && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="cursor-pointer" data-testid="link-orders-menu">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/bookings" className="cursor-pointer" data-testid="link-bookings">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>My Bookings</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer" data-testid="link-admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer text-destructive" data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isLoading && !isAuthenticated && (
            <Button asChild data-testid="button-login">
              <a href="/api/login">Get Started</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
