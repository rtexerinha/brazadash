import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewDisplay } from "@/components/review-display";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Star, Clock, MapPin, Phone, Plus, Minus, ChevronLeft, Utensils } from "lucide-react";
import { useState } from "react";
import type { Restaurant, MenuItem, Review } from "@shared/schema";

function MenuItemCard({ item, restaurant }: { item: MenuItem; restaurant: Restaurant }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, items } = useCart();
  const { toast } = useToast();

  const cartItem = items.find((i) => i.menuItemId === item.id);
  const currentQuantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    });
    toast({
      title: "Added to cart",
      description: `${quantity}x ${item.name} added to your order`,
    });
    setQuantity(1);
  };

  return (
    <Card className="overflow-hidden" data-testid={`card-menu-item-${item.id}`}>
      <div className="flex flex-col sm:flex-row">
        {item.imageUrl && (
          <div className="sm:w-32 sm:h-32 h-40 shrink-0 overflow-hidden bg-muted">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold" data-testid={`text-menu-item-name-${item.id}`}>{item.name}</h4>
              {!item.isAvailable && (
                <Badge variant="secondary">Unavailable</Badge>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {item.description}
              </p>
            )}
            <p className="font-bold text-primary" data-testid={`text-menu-item-price-${item.id}`}>
              ${parseFloat(item.price).toFixed(2)}
            </p>
          </div>
          
          {item.isAvailable && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2 bg-muted rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAddToCart} className="flex-1" data-testid={`button-add-to-cart-${item.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Cart
                {currentQuantityInCart > 0 && ` (${currentQuantityInCart} in cart)`}
              </Button>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getItemCount } = useCart();

  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", id],
  });

  const { data: menuItems, isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", id, "menu"],
    enabled: !!id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: ["/api/restaurants", id, "reviews"],
    enabled: !!id,
  });

  // Group menu items by category
  const categories = menuItems?.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

  if (restaurantLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full max-w-lg mb-8" />
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Utensils className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Restaurant not found</h2>
          <p className="text-muted-foreground mb-4">This restaurant may no longer be available.</p>
          <Button asChild>
            <Link href="/restaurants">Browse Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Utensils className="h-24 w-24 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <Link href="/restaurants">
              <Button variant="ghost" className="mb-4 text-white hover:bg-white/20" data-testid="button-back">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="text-restaurant-title">
              {restaurant.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{parseFloat(restaurant.rating || "0").toFixed(1)}</span>
                <span>({restaurant.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              {restaurant.cuisine && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {restaurant.cuisine}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Menu</h2>
              <p className="text-muted-foreground">{restaurant.description}</p>
            </div>

            {menuLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : Object.keys(categories).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(categories).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{category}</h3>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No menu items available yet.</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Restaurant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Restaurant Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    <p className="text-sm text-muted-foreground">{restaurant.city}</p>
                  </div>
                </div>
                {restaurant.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{restaurant.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Time</p>
                    <p className="text-sm text-muted-foreground">{restaurant.deliveryTime}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Delivery Fee: </span>
                    <span className="font-medium">${parseFloat(restaurant.deliveryFee || "0").toFixed(2)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cart Summary */}
            {getItemCount() > 0 && (
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Items in cart</span>
                    <Badge variant="secondary">{getItemCount()}</Badge>
                  </div>
                  <Button variant="secondary" className="w-full" asChild data-testid="button-view-cart">
                    <Link href="/cart">View Cart</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Reviews</h3>
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((review: Review) => (
                    <ReviewDisplay
                      key={review.id}
                      review={review}
                      customerName="Customer"
                      type="food"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
