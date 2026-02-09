import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, MapPin, Search, Utensils } from "lucide-react";
import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import type { Restaurant } from "@shared/schema";

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useLanguage();
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-restaurant-${restaurant.id}`}>
        <div className="aspect-[16/10] overflow-hidden bg-muted">
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
                {t("restaurants.open")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">{t("restaurants.closed")}</Badge>
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
            <span className="ml-auto font-medium text-foreground">${parseFloat(restaurant.deliveryFee || "0").toFixed(2)} {t("home.delivery")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RestaurantSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/10]" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function RestaurantsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    if (!searchTerm) return restaurants;
    
    const term = searchTerm.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.cuisine?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term)
    );
  }, [restaurants, searchTerm]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("restaurants.title")}</h1>
          <p className="text-muted-foreground">{t("restaurants.subtitle")}</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("restaurants.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <RestaurantSkeleton key={i} />
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? t("restaurants.noResults") : "No restaurants yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? t("restaurants.noResultsDesc")
                : "Be the first to add your restaurant to BrazaDash!"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
