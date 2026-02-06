import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, MapPin, CreditCard, Lock, CheckCircle } from "lucide-react";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

function PaymentForm({ clientSecret, total, onSuccess }: {
  clientSecret: string;
  total: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/checkout/success",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setPaymentReady(true)}
        options={{
          layout: "tabs",
        }}
      />
      {!paymentReady && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading payment form...</span>
        </div>
      )}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!stripe || !elements || isProcessing || !paymentReady}
        data-testid="button-place-order"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay ${total.toFixed(2)}
          </>
        )}
      </Button>
    </div>
  );
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { items, getSubtotal, getRestaurantId, clearCart } = useCart();
  const { toast } = useToast();

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tip, setTip] = useState("0");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const deliveryFee = 3.99;
  const tipAmount = parseFloat(tip) || 0;
  const total = subtotal + deliveryFee + tipAmount;

  const { data: stripeConfig } = useQuery<{ publishableKey: string }>({
    queryKey: ["/api/stripe/config"],
  });

  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/checkout/create-payment-intent", {
        restaurantId: getRestaurantId(),
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        deliveryAddress: address,
        notes,
        tip: tipAmount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const response = await apiRequest("POST", "/api/checkout/confirm-payment", {
        paymentIntentId,
      });
      return response.json();
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setOrderComplete(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Order Error",
        description: "Payment was successful but order creation failed. Please contact support.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (address.trim().length >= 5 && items.length > 0 && !clientSecret && !createPaymentIntent.isPending) {
      createPaymentIntent.mutate();
    }
  }, [address, clientSecret]);

  if (items.length === 0 && !orderComplete) {
    navigate("/cart");
    return null;
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-fit">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-center text-2xl" data-testid="text-order-confirmed">Order Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for your order! Your food is being prepared and will be on its way soon.
            </p>
            {orderId && (
              <p className="text-sm">
                Order ID: <span className="font-mono font-medium" data-testid="text-order-id">{orderId.slice(0, 8)}...</span>
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4 flex-wrap">
            {orderId && (
              <Button onClick={() => navigate(`/orders/${orderId}`)} data-testid="button-view-order">
                View Order
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/restaurants")} data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const publishableKey = stripeConfig?.publishableKey;
  const stripeInstance = publishableKey ? getStripePromise(publishableKey) : null;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your delivery address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="resize-none"
                    data-testid="input-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Apartment number, gate code, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add a Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {["0", "2", "5", "10"].map((amount) => (
                    <Button
                      key={amount}
                      variant={tip === amount ? "default" : "outline"}
                      onClick={() => {
                        setTip(amount);
                        setClientSecret(null);
                      }}
                      data-testid={`button-tip-${amount}`}
                    >
                      {amount === "0" ? "No tip" : `$${amount}`}
                    </Button>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={tip}
                      onChange={(e) => {
                        setTip(e.target.value);
                        setClientSecret(null);
                      }}
                      className="w-24"
                      data-testid="input-custom-tip"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!publishableKey ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading payment...</span>
                  </div>
                ) : address.trim().length < 5 ? (
                  <div className="p-4 border rounded-md bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please enter your delivery address above to proceed with payment.
                    </p>
                  </div>
                ) : !clientSecret ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Preparing payment form...</span>
                  </div>
                ) : stripeInstance ? (
                  <Elements
                    stripe={stripeInstance}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#1B9B59",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      total={total}
                      onSuccess={(paymentIntentId) => confirmPayment.mutate(paymentIntentId)}
                    />
                  </Elements>
                ) : null}
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Payments are securely processed by Stripe</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between gap-1 text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between gap-1">
                    <span className="text-muted-foreground">Tip</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between gap-1 text-lg font-semibold">
                  <span>Total</span>
                  <span data-testid="text-checkout-total">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
