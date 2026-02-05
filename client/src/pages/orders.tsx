import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Package, ChevronRight, Clock, MapPin } from "lucide-react";
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

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrderCard({ order }: { order: Order & { restaurant?: { name: string } } }) {
  const items = order.items as Array<{ name: string; quantity: number }>;
  const itemSummary = items.map((i) => `${i.quantity}x ${i.name}`).slice(0, 3).join(", ");
  const moreItems = items.length > 3 ? ` +${items.length - 3} more` : "";

  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`card-order-${order.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold" data-testid={`text-order-restaurant-${order.id}`}>
                {(order as any).restaurant?.name || "Restaurant"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.createdAt!), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <Badge className={statusColors[order.status] || ""} data-testid={`badge-status-${order.id}`}>
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {itemSummary}{moreItems}
          </p>

          <div className="flex items-center justify-between">
            <span className="font-semibold" data-testid={`text-order-total-${order.id}`}>
              ${parseFloat(order.total).toFixed(2)}
            </span>
            <Button variant="ghost" size="sm">
              View Details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
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
  const { data: orders, isLoading } = useQuery<(Order & { restaurant?: { name: string } })[]>({
    queryKey: ["/api/orders"],
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground mb-8">Track and manage your order history</p>

        {isLoading ? (
          <div className="space-y-4 max-w-2xl">
            {[...Array(3)].map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4 max-w-2xl">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center max-w-2xl">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              When you place your first order, it will appear here.
            </p>
            <Button asChild>
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
