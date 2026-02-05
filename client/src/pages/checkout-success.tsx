import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutSuccessPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");

  const completeCheckout = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/checkout/complete", {
        sessionId,
      });
      return response.json();
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setStatus("success");
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (sessionId && status === "loading") {
      completeCheckout.mutate();
    } else if (!sessionId) {
      navigate("/");
    }
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Processing your order...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 rounded-full p-3 w-fit">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              We couldn't process your order. Please contact support if you were charged.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Link href="/cart">
              <Button variant="outline" data-testid="button-back-cart">Return to Cart</Button>
            </Link>
            <Link href="/">
              <Button data-testid="button-go-home">Go Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-fit">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-center text-2xl">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for your order! Your food is being prepared and will be on its way soon.
          </p>
          {orderId && (
            <p className="text-sm">
              Order ID: <span className="font-mono font-medium">{orderId.slice(0, 8)}...</span>
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {orderId && (
            <Link href={`/orders/${orderId}`}>
              <Button data-testid="button-view-order">View Order</Button>
            </Link>
          )}
          <Link href="/restaurants">
            <Button variant="outline" data-testid="button-continue-shopping">Continue Shopping</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
