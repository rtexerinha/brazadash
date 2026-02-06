import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Store, Plus, Utensils, Package, Star, DollarSign, Loader2, Pencil, Trash2, Clock, CheckCircle, Truck, MapPin, XCircle, ChefHat, Upload, ImageIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import type { Restaurant, MenuItem, Order } from "@shared/schema";

const restaurantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().optional(),
  imageUrl: z.string().optional(),
  deliveryFee: z.string().default("3.99"),
  deliveryTime: z.string().default("30-45 min"),
});

const menuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  quantity: z.string().optional(),
});

function CreateRestaurantDialog({ onSuccess, variant = "header" }: { onSuccess: () => void; variant?: "header" | "empty-state" }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const form = useForm<z.infer<typeof restaurantSchema>>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisine: "Brazilian",
      address: "",
      city: "",
      phone: "",
      imageUrl: "",
      deliveryFee: "3.99",
      deliveryTime: "30-45 min",
    },
  });

  const createRestaurant = useMutation({
    mutationFn: async (data: z.infer<typeof restaurantSchema>) => {
      return apiRequest("POST", "/api/vendor/restaurants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants"] });
      toast({ title: "Restaurant created!", description: "Your restaurant has been added successfully." });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create restaurant.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid={variant === "header" ? "button-create-restaurant" : "button-create-restaurant-empty"}>
          <Plus className="mr-2 h-4 w-4" />
          {t("vendor.createRestaurant")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("vendor.createRestaurant")}</DialogTitle>
          <DialogDescription>Add your restaurant to BrazaDash</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createRestaurant.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.restaurantName")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-restaurant-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" data-testid="input-restaurant-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.cuisine")}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-restaurant-cuisine" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-restaurant-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.address")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-restaurant-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-restaurant-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.deliveryFee")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-restaurant-delivery-fee" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." data-testid="input-restaurant-image" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createRestaurant.isPending} data-testid="button-submit-restaurant">
                {createRestaurant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createRestaurant.isPending ? t("vendor.creating") : t("vendor.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddMenuItemDialog({ restaurantId, onSuccess }: { restaurantId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      quantity: "",
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      form.setValue("imageUrl", data.url);
      setImagePreview(data.url);
      toast({ title: t("vendor.imageUploaded") });
    } catch {
      toast({ title: t("vendor.imageUploadError"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const createMenuItem = useMutation({
    mutationFn: async (data: z.infer<typeof menuItemSchema>) => {
      const payload = {
        ...data,
        quantity: data.quantity ? parseInt(data.quantity, 10) : -1,
      };
      return apiRequest("POST", `/api/vendor/restaurants/${restaurantId}/menu`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants", restaurantId, "menu"] });
      toast({ title: t("vendor.menuItemAdded") });
      setOpen(false);
      form.reset();
      setImagePreview(null);
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: t("vendor.menuItemError"), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) { setImagePreview(null); form.reset(); }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-menu-item">
          <Plus className="mr-2 h-4 w-4" />
          {t("vendor.addMenuItem")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("vendor.addMenuItem")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMenuItem.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.itemName")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-menu-item-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" data-testid="input-menu-item-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.price")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-menu-item-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.category")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Main Dishes" data-testid="input-menu-item-category" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.quantity")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" placeholder={t("vendor.quantityPlaceholder")} data-testid="input-menu-item-quantity" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("vendor.quantityHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>{t("vendor.itemImage")}</FormLabel>
              <div className="mt-2 space-y-3">
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        form.setValue("imageUrl", "");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      data-testid="button-remove-image"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {t("vendor.removeImage")}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover-elevate transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-menu-item-image"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t("vendor.uploadImage")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("vendor.uploadImageHint")}</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  data-testid="input-menu-item-file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMenuItem.isPending || uploading} data-testid="button-submit-menu-item">
                {createMenuItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("vendor.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function VendorDashboard({ restaurant }: { restaurant: Restaurant }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const { data: menuItems, isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/vendor/restaurants", restaurant.id, "menu"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/vendor/restaurants", restaurant.id, "orders"],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PATCH", `/api/vendor/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants", restaurant.id, "orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const toggleOpen = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/vendor/restaurants/${restaurant.id}`, { isOpen: !restaurant.isOpen });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants"] });
      toast({ title: restaurant.isOpen ? "Restaurant closed" : "Restaurant opened" });
    },
  });

  const pendingOrders = orders?.filter((o) => o.status === "pending") || [];
  const activeOrders = orders?.filter((o) => ["confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status)) || [];
  const completedOrders = orders?.filter((o) => ["delivered", "cancelled"].includes(o.status)) || [];

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: t("vendor.newOrder"), color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    confirmed: { label: t("vendor.orderConfirmed"), color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
    preparing: { label: t("vendor.orderPreparing"), color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: ChefHat },
    ready: { label: t("vendor.orderReady"), color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Package },
    out_for_delivery: { label: t("vendor.orderOutForDelivery"), color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: Truck },
    delivered: { label: t("vendor.orderDelivered"), color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
    cancelled: { label: t("vendor.orderCancelled"), color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-vendor-restaurant-name">{restaurant.name}</h2>
          <p className="text-muted-foreground">{restaurant.address}, {restaurant.city}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={restaurant.isOpen ?? false}
              onCheckedChange={() => toggleOpen.mutate()}
              data-testid="switch-restaurant-open"
            />
            <span className="text-sm font-medium">
              {restaurant.isOpen ? t("vendor.restaurantOpen") : t("vendor.restaurantClosed")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-sm text-muted-foreground">{t("vendor.pending")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeOrders.length}</p>
                <p className="text-sm text-muted-foreground">{t("vendor.active")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(restaurant.rating || "0").toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">{t("vendor.rating")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{menuItems?.length || 0}</p>
                <p className="text-sm text-muted-foreground">{t("vendor.menuItems")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders" data-testid="tab-orders">{t("vendor.orders")}</TabsTrigger>
          <TabsTrigger value="menu" data-testid="tab-menu">{t("vendor.menu")}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-8">
              {pendingOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="font-semibold text-lg" data-testid="text-section-pending">
                      {t("vendor.newOrders")} ({pendingOrders.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {pendingOrders.map((order) => {
                      const items = order.items as Array<{ name: string; quantity: number; price: number }>;
                      const config = statusConfig[order.status];
                      const StatusIcon = config.icon;
                      return (
                        <Card key={order.id} className="border-yellow-200 dark:border-yellow-800" data-testid={`vendor-order-${order.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold" data-testid={`text-order-id-${order.id}`}>Order #{order.id.slice(0, 8)}</p>
                                  <Badge className={config.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(order.createdAt!), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <p className="font-semibold text-lg" data-testid={`text-order-total-${order.id}`}>
                                ${parseFloat(order.total).toFixed(2)}
                              </p>
                            </div>
                            <div className="mb-3 p-3 rounded-md bg-muted/50">
                              <p className="text-sm font-medium mb-1">{t("cart.items")}:</p>
                              {items.map((item, idx) => (
                                <p key={idx} className="text-sm text-muted-foreground">
                                  {item.quantity}x {item.name} {item.price ? `- $${(item.price * item.quantity).toFixed(2)}` : ""}
                                </p>
                              ))}
                            </div>
                            {order.deliveryAddress && (
                              <div className="flex items-start gap-2 mb-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{order.deliveryAddress}</span>
                              </div>
                            )}
                            {order.notes && (
                              <p className="text-sm text-muted-foreground mb-3 italic">Note: {order.notes}</p>
                            )}
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus.mutate({ orderId: order.id, status: "cancelled" })}
                                data-testid={`button-decline-${order.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {t("vendor.decline")}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateStatus.mutate({ orderId: order.id, status: "confirmed" })}
                                data-testid={`button-accept-${order.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {t("vendor.accept")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-lg" data-testid="text-section-active">
                      {t("vendor.activeOrders")} ({activeOrders.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {activeOrders.map((order) => {
                      const items = order.items as Array<{ name: string; quantity: number; price: number }>;
                      const config = statusConfig[order.status];
                      const StatusIcon = config.icon;
                      const nextStatus: Record<string, { status: string; label: string; icon: typeof Clock }> = {
                        confirmed: { status: "preparing", label: t("vendor.startPreparing"), icon: ChefHat },
                        preparing: { status: "ready", label: t("vendor.readyForPickup"), icon: Package },
                        ready: { status: "out_for_delivery", label: t("vendor.outForDelivery"), icon: Truck },
                        out_for_delivery: { status: "delivered", label: t("vendor.markDelivered"), icon: CheckCircle },
                      };
                      const next = nextStatus[order.status];
                      return (
                        <Card key={order.id} data-testid={`vendor-order-${order.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold" data-testid={`text-order-id-${order.id}`}>Order #{order.id.slice(0, 8)}</p>
                                  <Badge className={config.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(order.createdAt!), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <p className="font-semibold" data-testid={`text-order-total-${order.id}`}>
                                ${parseFloat(order.total).toFixed(2)}
                              </p>
                            </div>
                            <div className="mb-3 text-sm text-muted-foreground">
                              {items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                            </div>
                            {order.deliveryAddress && (
                              <div className="flex items-start gap-2 mb-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{order.deliveryAddress}</span>
                              </div>
                            )}
                            {next && (
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus.mutate({ orderId: order.id, status: next.status })}
                                  data-testid={`button-status-${order.id}`}
                                >
                                  <next.icon className="h-4 w-4 mr-1" />
                                  {next.label}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {completedOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg" data-testid="text-section-completed">
                      {t("vendor.completed")} ({completedOrders.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {completedOrders.slice(0, 10).map((order) => {
                      const items = order.items as Array<{ name: string; quantity: number }>;
                      const config = statusConfig[order.status];
                      const StatusIcon = config.icon;
                      return (
                        <Card key={order.id} className="opacity-80" data-testid={`vendor-order-${order.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</p>
                                  <Badge className={config.color} variant="secondary">
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(order.createdAt!), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <p className="font-medium text-sm">${parseFloat(order.total).toFixed(2)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {pendingOrders.length === 0 && activeOrders.length === 0 && completedOrders.length === 0 && (
                <Card className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("vendor.noOrders")}</p>
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("vendor.noOrders")}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{t("vendor.menuItems")}</h3>
            <AddMenuItemDialog restaurantId={restaurant.id} onSuccess={() => {}} />
          </div>
          
          {menuLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : menuItems && menuItems.length > 0 ? (
            <div className="space-y-3">
              {menuItems.map((item) => {
                const qty = item.quantity ?? -1;
                const isOutOfStock = qty === 0;
                const showQuantity = qty >= 0;
                return (
                  <Card key={item.id} className={isOutOfStock ? "opacity-60" : ""} data-testid={`vendor-menu-item-${item.id}`}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-16 w-16 rounded-md object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <p className="font-semibold text-primary">${parseFloat(item.price).toFixed(2)}</p>
                            {showQuantity && (
                              <span className="text-xs text-muted-foreground" data-testid={`text-menu-qty-${item.id}`}>
                                {isOutOfStock ? "" : `${qty} ${t("vendor.inStock")}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isOutOfStock ? (
                          <Badge variant="destructive" data-testid={`badge-unavailable-${item.id}`}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {t("vendor.outOfStock")}
                          </Badge>
                        ) : (
                          <Badge variant={item.isAvailable ? "secondary" : "outline"}>
                            {item.isAvailable ? t("vendor.available") : t("vendor.unavailable")}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("vendor.noMenuItems")}</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function VendorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/vendor/restaurants"],
    enabled: !!user,
  });

  const myRestaurant = restaurants?.[0];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("vendor.dashboard")}</h1>
            <p className="text-muted-foreground">Manage your restaurant and orders</p>
          </div>
          {!myRestaurant && <CreateRestaurantDialog onSuccess={() => {}} />}
        </div>

        {myRestaurant ? (
          <VendorDashboard restaurant={myRestaurant} />
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Store className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start Your Restaurant</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Join BrazaDash and start serving authentic Brazilian food to customers in California.
            </p>
            <CreateRestaurantDialog onSuccess={() => {}} variant="empty-state" />
          </Card>
        )}
      </div>
    </div>
  );
}
