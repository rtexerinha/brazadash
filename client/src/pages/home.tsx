import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Star, Clock, MapPin, ChevronRight, Utensils } from "lucide-react";
import type { Restaurant } from "@shared/schema";

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-restaurant-${restaurant.id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Utensils className="h-12 w-12 text-primary/50" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-restaurant-name-${restaurant.id}`}>
              {restaurant.name}
            </h3>
            {restaurant.isOpen ? (
              <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Open
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">Closed</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {restaurant.description || restaurant.cuisine}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{parseFloat(restaurant.rating || "0").toFixed(1)}</span>
              <span>({restaurant.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{restaurant.deliveryTime}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{restaurant.city}</span>
            <span className="ml-auto font-medium text-foreground">${parseFloat(restaurant.deliveryFee || "0").toFixed(2)} delivery</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RestaurantSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const featuredRestaurants = restaurants?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {/* Welcome Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-welcome">
              Ola, {user?.firstName || "amigo"}! 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              What are you craving today? Explore authentic Brazilian restaurants near you.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Featured Restaurants</h2>
              <p className="text-muted-foreground">Discover the best Brazilian food in your area</p>
            </div>
            <Button variant="ghost" asChild data-testid="button-view-all">
              <Link href="/restaurants">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <RestaurantSkeleton key={i} />
              ))}
            </div>
          ) : featuredRestaurants.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Utensils className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No restaurants yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to add your restaurant to BrazaDash!
              </p>
              <Button asChild>
                <Link href="/vendor">Become a Vendor</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Churrasco", image: "/images/food-picanha.png" },
              { name: "Acai", image: "/images/food-acai.png" },
              { name: "Salgados", image: "/images/food-coxinha.png" },
              { name: "Pao de Queijo", image: "/images/food-paodequeijo.png" },
            ].map((category) => (
              <Link key={category.name} href={`/restaurants?cuisine=${category.name}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-category-${category.name.toLowerCase()}`}>
                  <div className="aspect-square relative">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-white font-semibold text-lg">{category.name}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
