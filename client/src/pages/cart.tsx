import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { Plus, Minus, Trash2, ShoppingBag, ChevronRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCart();
  const { t } = useLanguage();

  const subtotal = getSubtotal();
  const deliveryFee = items.length > 0 ? 3.99 : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("cart.empty")}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t("cart.emptyDesc")}
          </p>
          <Button size="lg" asChild data-testid="button-browse-restaurants">
            <Link href="/restaurants">
              {t("cart.browseRestaurants")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const restaurantName = items[0]?.restaurantName;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">{t("cart.title")}</h1>
        <p className="text-muted-foreground mb-8">
          {t("cart.orderFrom")} <span className="font-medium text-foreground">{restaurantName}</span>
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>{t("cart.items")}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive"
                  data-testid="button-clear-cart"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("cart.clearCart")}
                </Button>
              </CardHeader>
              <CardContent className="divide-y">
                {items.map((item) => (
                  <div key={item.menuItemId} className="py-4 first:pt-0 last:pb-0" data-testid={`cart-item-${item.menuItemId}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium" data-testid={`text-cart-item-name-${item.menuItemId}`}>{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(item.price).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            data-testid={`button-decrease-${item.menuItemId}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.menuItemId}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            data-testid={`button-increase-${item.menuItemId}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.menuItemId)}
                          className="text-destructive"
                          data-testid={`button-remove-${item.menuItemId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium mt-2" data-testid={`text-item-total-${item.menuItemId}`}>
                      {t("cart.subtotal")}: ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cart.deliveryFee")}</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t("cart.total")}</span>
                  <span data-testid="text-total">${total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" asChild data-testid="button-checkout">
                  <Link href="/checkout">
                    {t("cart.proceedToCheckout")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
