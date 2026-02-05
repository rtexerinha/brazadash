import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FoodReviewForm } from "@/components/food-review-form";
import { format } from "date-fns";
import { Package, MapPin, Clock, ChevronLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
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
  ready: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusSteps = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

function OrderProgress({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusSteps.indexOf(currentStatus);
  
  if (currentStatus === "cancelled") {
    return (
      <div className="p-4 bg-destructive/10 rounded-md text-center">
        <p className="text-destructive font-medium">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusSteps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>
                {statusLabels[step]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [hasReviewed, setHasReviewed] = useState(false);

  const { data: order, isLoading } = useQuery<Order & { restaurant?: { name: string }; hasReview?: boolean }>({
    queryKey: ["/api/orders", id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-40 mb-6" />
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-4">This order may no longer exist.</p>
          <Button asChild>
            <Link href="/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const items = order.items as Array<{ name: string; quantity: number; price: string }>;
  const canReview = order.status === "delivered" && !order.hasReview && !hasReviewed;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6" data-testid="button-back-orders">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-order-title">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(order.createdAt!), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge className={statusColors[order.status] || ""} data-testid="badge-order-status">
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderProgress currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">{order.deliveryAddress || "Not provided"}</p>
                </div>
              </div>
              {order.notes && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Instructions</p>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Order from {(order as any).restaurant?.name || "Restaurant"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>${parseFloat(order.deliveryFee).toFixed(2)}</span>
              </div>
              {parseFloat(order.tip || "0") > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip</span>
                  <span>${parseFloat(order.tip || "0").toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span data-testid="text-order-total">${parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Section */}
        {canReview && (
          <div className="mt-6">
            <FoodReviewForm
              orderId={order.id}
              restaurantId={order.restaurantId}
              restaurantName={(order as any).restaurant?.name || "the restaurant"}
              onSuccess={() => setHasReviewed(true)}
            />
          </div>
        )}

        {(order.hasReview || hasReviewed) && (
          <Card className="mt-6 bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="font-medium">Thank you for your review!</p>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve our service.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
