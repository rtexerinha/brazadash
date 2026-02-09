import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Package, ChevronRight, Store } from "lucide-react";
import type { Order } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ready: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  out_for_delivery: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusTranslationKeys: Record<string, string> = {
  pending: "orders.pending",
  confirmed: "orders.confirmed",
  preparing: "orders.preparing",
  ready: "orders.ready",
  out_for_delivery: "orders.outForDelivery",
  delivered: "orders.delivered",
  cancelled: "orders.cancelled",
};

type OrderWithRestaurant = Order & { restaurant?: { name: string } };

function groupOrdersByRestaurant(orders: OrderWithRestaurant[]) {
  const grouped: Record<string, { restaurantName: string; restaurantId: string; orders: OrderWithRestaurant[] }> = {};
  for (const order of orders) {
    const key = order.restaurantId;
    if (!grouped[key]) {
      grouped[key] = {
        restaurantName: order.restaurant?.name || "Unknown Restaurant",
        restaurantId: order.restaurantId,
        orders: [],
      };
    }
    grouped[key].orders.push(order);
  }
  return Object.values(grouped);
}

function OrderCard({ order }: { order: OrderWithRestaurant }) {
  const { t } = useLanguage();
  const items = order.items as Array<{ name: string; quantity: number }>;
  const itemSummary = items.map((i) => `${i.quantity}x ${i.name}`).slice(0, 3).join(", ");
  const moreItems = items.length > 3 ? ` +${items.length - 3} more` : "";

  return (
    <Link href={`/orders/${order.id}`} data-testid={`link-order-${order.id}`}>
      <div className="flex items-center justify-between gap-4 p-4 border rounded-md hover-elevate cursor-pointer" data-testid={`card-order-${order.id}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.createdAt!), "MMM d, yyyy 'at' h:mm a")}
            </p>
            <Badge className={statusColors[order.status] || ""} data-testid={`badge-status-${order.id}`}>
              {statusTranslationKeys[order.status] ? t(statusTranslationKeys[order.status]) : order.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {itemSummary}{moreItems}
          </p>
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="font-semibold" data-testid={`text-order-total-${order.id}`}>
              ${parseFloat(order.total).toFixed(2)}
            </span>
            <Button variant="ghost" size="sm" data-testid={`button-view-order-${order.id}`}>
              {t("orders.viewDetails")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function OrderSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const { t } = useLanguage();
  const { data: orders, isLoading } = useQuery<OrderWithRestaurant[]>({
    queryKey: ["/api/orders"],
  });

  const grouped = orders ? groupOrdersByRestaurant(orders) : [];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-orders-title">{t("orders.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("orders.subtitle")}</p>

        {isLoading ? (
          <div className="space-y-4 max-w-2xl">
            {[...Array(3)].map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : grouped.length > 0 ? (
          <div className="space-y-6 max-w-2xl">
            {grouped.map((group) => (
              <Card key={group.restaurantId} data-testid={`group-restaurant-${group.restaurantId}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-group-name-${group.restaurantId}`}>
                        {group.restaurantName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {group.orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center max-w-2xl">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("orders.noOrders")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("orders.noOrdersDesc")}
            </p>
            <Button asChild data-testid="button-browse-restaurants">
              <Link href="/restaurants">{t("orders.browseRestaurants")}</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
