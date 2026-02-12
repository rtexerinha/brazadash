import { useState, useRef, useMemo, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Store, Plus, Utensils, Package, Star, DollarSign, Loader2, Pencil, Trash2, Clock, CheckCircle, CheckCircle2, Truck, MapPin, XCircle, ChefHat, Upload, ImageIcon, AlertTriangle, AlertCircle, Calendar, TrendingUp, Filter, BarChart3, Smartphone, CreditCard, RefreshCw, Wifi } from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
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

type DateRange = "today" | "week" | "month" | "all";
type StatusFilter = "all" | "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";

function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "all": return null;
  }
}

function VendorDashboard({ restaurant }: { restaurant: Restaurant }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
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

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = [...orders];
    const rangeStart = getDateRangeStart(dateRange);
    if (rangeStart) {
      filtered = filtered.filter((o) => o.createdAt && new Date(o.createdAt) >= rangeStart);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    return filtered;
  }, [orders, dateRange, statusFilter]);

  const revenueStats = useMemo(() => {
    const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const avgOrder = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    return { totalRevenue, orderCount: deliveredOrders.length, avgOrder };
  }, [filteredOrders]);

  const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
  const activeOrders = filteredOrders.filter((o) => ["confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status));
  const completedOrders = filteredOrders.filter((o) => ["delivered", "cancelled"].includes(o.status));

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
          <TabsTrigger value="settings" data-testid="tab-settings">{t("vendor.settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-6">
              {/* Revenue Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-revenue">${revenueStats.totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{t("vendor.revenue")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-total-orders">{revenueStats.orderCount}</p>
                        <p className="text-sm text-muted-foreground">{t("vendor.totalOrders")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-avg-order">${revenueStats.avgOrder.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{t("vendor.avgOrder")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("vendor.dateRange")}:</span>
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                    <SelectTrigger className="w-[140px]" data-testid="select-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">{t("vendor.today")}</SelectItem>
                      <SelectItem value="week">{t("vendor.thisWeek")}</SelectItem>
                      <SelectItem value="month">{t("vendor.thisMonth")}</SelectItem>
                      <SelectItem value="all">{t("vendor.allTime")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("vendor.filterByStatus")}:</span>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("vendor.allStatuses")}</SelectItem>
                      <SelectItem value="pending">{t("vendor.newOrder")}</SelectItem>
                      <SelectItem value="confirmed">{t("vendor.orderConfirmed")}</SelectItem>
                      <SelectItem value="preparing">{t("vendor.orderPreparing")}</SelectItem>
                      <SelectItem value="ready">{t("vendor.orderReady")}</SelectItem>
                      <SelectItem value="out_for_delivery">{t("vendor.orderOutForDelivery")}</SelectItem>
                      <SelectItem value="delivered">{t("vendor.orderDelivered")}</SelectItem>
                      <SelectItem value="cancelled">{t("vendor.orderCancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-muted-foreground ml-auto" data-testid="text-filtered-count">
                  {filteredOrders.length} {t("vendor.filteredOrders")}
                </span>
              </div>

              {filteredOrders.length === 0 ? (
                <Card className="p-8 text-center">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("vendor.noFilteredOrders")}</p>
                </Card>
              ) : (
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

        <TabsContent value="settings" className="mt-6 space-y-6">
          <BusinessImageSettings
            type="restaurant"
            entityId={restaurant.id}
            currentLogo={restaurant.imageUrl || null}
            currentGallery={(restaurant.galleryImages as string[]) || []}
          />
          <BankInfoSettings
            type="restaurant"
            entityId={restaurant.id}
            initialData={{
              bankName: restaurant.bankName || "",
              routingNumber: restaurant.routingNumber || "",
              bankAccountNumber: restaurant.bankAccountNumber || "",
              zelleInfo: restaurant.zelleInfo || "",
              venmoInfo: restaurant.venmoInfo || "",
            }}
          />
          <TerminalSettings
            restaurant={restaurant}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BusinessImageSettings({ type, entityId, currentLogo, currentGallery }: {
  type: "restaurant" | "provider";
  entityId: string;
  currentLogo: string | null;
  currentGallery: string[];
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(currentLogo);
  const [gallery, setGallery] = useState<string[]>(currentGallery);
  const [uploading, setUploading] = useState(false);

  const patchEndpoint = type === "restaurant"
    ? `/api/vendor/restaurants/${entityId}`
    : "/api/provider/profile";
  const cacheKey = type === "restaurant" ? "/api/vendor/restaurants" : "/api/provider/profile";

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch {
      toast({ title: t("common.error"), description: t("settings.uploadFailed"), variant: "destructive" });
      return null;
    }
  };

  const saveLogo = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest("PATCH", patchEndpoint, { imageUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [cacheKey] });
      toast({ title: t("settings.logoSaved") });
    },
  });

  const saveGallery = useMutation({
    mutationFn: async (images: string[]) => {
      return apiRequest("PATCH", patchEndpoint, { galleryImages: images });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [cacheKey] });
      toast({ title: t("settings.gallerySaved") });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      setLogo(url);
      saveLogo.mutate(url);
    }
    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) newUrls.push(url);
    }
    if (newUrls.length > 0) {
      const updated = [...gallery, ...newUrls];
      setGallery(updated);
      saveGallery.mutate(updated);
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (index: number) => {
    const updated = gallery.filter((_, i) => i !== index);
    setGallery(updated);
    saveGallery.mutate(updated);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{t("settings.businessImages")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("settings.businessImagesDesc")}</p>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">{t("settings.businessLogo")}</Label>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setLogo(null);
                      saveLogo.mutate("");
                    }}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                    data-testid="button-remove-logo"
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/30">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                  data-testid="input-logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading || saveLogo.isPending}
                  data-testid="button-upload-logo"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? t("common.saving") : t("settings.uploadLogo")}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">{t("settings.imageRequirements")}</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">{t("settings.businessPhotos")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
              {gallery.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-md overflow-hidden border group">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 invisible group-hover:visible"
                    data-testid={`button-remove-gallery-${i}`}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
              <div
                className="aspect-video rounded-md border border-dashed flex flex-col items-center justify-center cursor-pointer bg-muted/30 hover-elevate"
                onClick={() => galleryInputRef.current?.click()}
                data-testid="button-add-gallery-photo"
              >
                <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">{t("settings.addPhoto")}</span>
              </div>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              data-testid="input-gallery-upload"
            />
            <p className="text-xs text-muted-foreground">{t("settings.galleryDesc")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BankInfoSettings({ type, entityId, initialData }: {
  type: "restaurant" | "provider";
  entityId: string;
  initialData: {
    bankName: string;
    routingNumber: string;
    bankAccountNumber: string;
    zelleInfo: string;
    venmoInfo: string;
  };
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bankName, setBankName] = useState(initialData.bankName);
  const [routingNumber, setRoutingNumber] = useState(initialData.routingNumber);
  const [bankAccountNumber, setBankAccountNumber] = useState(initialData.bankAccountNumber);
  const [zelleInfo, setZelleInfo] = useState(initialData.zelleInfo);
  const [venmoInfo, setVenmoInfo] = useState(initialData.venmoInfo);

  const updateBankInfo = useMutation({
    mutationFn: async () => {
      const endpoint = type === "restaurant"
        ? `/api/vendor/restaurants/${entityId}`
        : "/api/provider/profile";
      return apiRequest("PATCH", endpoint, {
        bankName: bankName || null,
        routingNumber: routingNumber || null,
        bankAccountNumber: bankAccountNumber || null,
        zelleInfo: zelleInfo || null,
        venmoInfo: venmoInfo || null,
      });
    },
    onSuccess: () => {
      const key = type === "restaurant" ? "/api/vendor/restaurants" : "/api/provider/profile";
      queryClient.invalidateQueries({ queryKey: [key] });
      toast({ title: t("vendor.bankInfoSaved"), description: t("vendor.bankInfoSavedDesc") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("vendor.bankInfoSaveFailed"), variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{t("onboarding.bankInfoTitle")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("onboarding.bankInfoDesc")}</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="settings-bank-name">{t("onboarding.bankName")}</Label>
            <Input
              id="settings-bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={t("onboarding.bankNamePlaceholder")}
              className="mt-1.5"
              data-testid="input-settings-bank-name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-routing">{t("onboarding.routingNumber")}</Label>
              <Input
                id="settings-routing"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder={t("onboarding.routingNumberPlaceholder")}
                className="mt-1.5"
                data-testid="input-settings-routing-number"
              />
            </div>
            <div>
              <Label htmlFor="settings-account">{t("onboarding.bankAccountNumber")}</Label>
              <Input
                id="settings-account"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder={t("onboarding.bankAccountPlaceholder")}
                className="mt-1.5"
                data-testid="input-settings-bank-account"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-zelle">{t("onboarding.zelleInfo")}</Label>
              <Input
                id="settings-zelle"
                value={zelleInfo}
                onChange={(e) => setZelleInfo(e.target.value)}
                placeholder={t("onboarding.zelleInfoPlaceholder")}
                className="mt-1.5"
                data-testid="input-settings-zelle"
              />
            </div>
            <div>
              <Label htmlFor="settings-venmo">{t("onboarding.venmoInfo")}</Label>
              <Input
                id="settings-venmo"
                value={venmoInfo}
                onChange={(e) => setVenmoInfo(e.target.value)}
                placeholder={t("onboarding.venmoInfoPlaceholder")}
                className="mt-1.5"
                data-testid="input-settings-venmo"
              />
            </div>
          </div>
          <Button
            onClick={() => updateBankInfo.mutate()}
            disabled={updateBankInfo.isPending}
            data-testid="button-save-bank-info"
          >
            {updateBankInfo.isPending ? t("common.saving") : t("vendor.saveBankInfo")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TerminalSettings({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [pendingPayment, setPendingPayment] = useState<{
    paymentIntentId: string;
    amount: string;
    description: string;
    readerLabel: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [capturedTipAmount, setCapturedTipAmount] = useState<number>(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = (paymentIntentId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPaymentStatus("waiting_for_card");
    let pollCount = 0;
    const maxPolls = 150;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;
      pollCount++;

      if (pollCount > maxPolls) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setPaymentStatus("timed_out");
        toast({
          title: "Payment Timed Out",
          description: "No card was detected within 5 minutes. The payment intent is still open in Stripe.",
          variant: "destructive",
        });
        setTimeout(() => { setPendingPayment(null); setPaymentStatus(""); }, 5000);
        isPolling = false;
        return;
      }

      try {
        const res = await apiRequest("GET", `/api/terminal/payment-intents/${paymentIntentId}/status`);
        const data = await res.json();

        if (data.status === "requires_capture") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPaymentStatus("capturing");
          try {
            const captureRes = await apiRequest("POST", `/api/terminal/payment-intents/${paymentIntentId}/capture`);
            const captureData = await captureRes.json();
            const tip = captureData.tipAmount || 0;
            setCapturedTipAmount(tip);
            setPaymentStatus("completed");
            const tipText = tip > 0 ? ` (includes $${(tip / 100).toFixed(2)} tip)` : "";
            toast({
              title: "Payment Completed",
              description: `$${(captureData.amount / 100).toFixed(2)} captured successfully${tipText}.`,
            });
            setTimeout(() => { setPendingPayment(null); setPaymentStatus(""); setCapturedTipAmount(0); }, 3000);
          } catch (captureErr: any) {
            console.error("Capture error:", captureErr);
            setPaymentStatus("capture_failed");
            toast({
              title: t("common.error"),
              description: "The payment was authorized but failed to capture. Please try again.",
              variant: "destructive",
            });
          }
        } else if (data.status === "canceled" || data.status === "cancelled") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPaymentStatus("cancelled");
          toast({ title: "Payment Cancelled", description: "The payment was cancelled.", variant: "destructive" });
          setTimeout(() => { setPendingPayment(null); setPaymentStatus(""); }, 3000);
        } else if (data.status === "succeeded") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPaymentStatus("completed");
          toast({ title: "Payment Completed", description: "Payment was already captured." });
          setTimeout(() => { setPendingPayment(null); setPaymentStatus(""); }, 3000);
        } else if (data.status === "requires_payment_method") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPaymentStatus("payment_failed");
          toast({
            title: t("terminal.paymentFailed") || "Payment Failed",
            description: t("terminal.cardDeclined") || "Card was declined or removed. Please try again.",
            variant: "destructive",
          });
        }
      } catch {
      } finally {
        isPolling = false;
      }
    };

    pollingRef.current = setInterval(poll, 2000);
  };

  const retryCapture = async () => {
    if (!pendingPayment) return;
    setPaymentStatus("capturing");
    try {
      const captureRes = await apiRequest("POST", `/api/terminal/payment-intents/${pendingPayment}/capture`);
      const captureData = await captureRes.json();
      const tip = captureData.tipAmount || 0;
      setCapturedTipAmount(tip);
      setPaymentStatus("completed");
      const tipText = tip > 0 ? ` (includes $${(tip / 100).toFixed(2)} tip)` : "";
      toast({
        title: "Payment Completed",
        description: `$${(captureData.amount / 100).toFixed(2)} captured successfully${tipText}.`,
      });
      setTimeout(() => { setPendingPayment(null); setPaymentStatus(""); setCapturedTipAmount(0); }, 3000);
    } catch (err: any) {
      console.error("Retry capture error:", err);
      setPaymentStatus("capture_failed");
      toast({
        title: t("common.error"),
        description: "Capture failed again. You can retry or capture manually in Stripe Dashboard.",
        variant: "destructive",
      });
    }
  };

  const cancelPendingPayment = async () => {
    if (!pendingPayment || !selectedReaderId) return;
    try {
      await apiRequest("POST", `/api/terminal/readers/${selectedReaderId}/cancel`, {
        restaurantId: restaurant.id,
      });
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      setPendingPayment(null);
      setPaymentStatus("");
      toast({ title: "Payment cancelled" });
    } catch {
      toast({ title: t("common.error"), description: "Failed to cancel", variant: "destructive" });
    }
  };

  const readersQuery = useQuery<{ readers: any[] }>({
    queryKey: ["/api/terminal/readers", restaurant.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/terminal/readers?restaurantId=${restaurant.id}`);
      return res.json();
    },
    enabled: !!restaurant.terminalEnabled,
  });

  const toggleTerminal = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("PATCH", "/api/terminal/settings", {
        restaurantId: restaurant.id,
        terminalEnabled: enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants"] });
      toast({ title: t("terminal.settingsUpdated") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("terminal.settingsUpdateFailed"), variant: "destructive" });
    },
  });

  const setupLocation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/terminal/locations", {
        restaurantId: restaurant.id,
        postalCode: postalCode || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants"] });
      toast({ title: t("terminal.locationCreated") });
      setPostalCode("");
    },
    onError: (error: Error) => {
      const msg = error.message || "";
      if (msg.includes("ZIP")) {
        toast({ title: t("common.error"), description: t("terminal.zipRequired"), variant: "destructive" });
      } else {
        toast({ title: t("common.error"), description: t("terminal.locationCreateFailed"), variant: "destructive" });
      }
    },
  });

  const createCharge = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/terminal/payment-intents", {
        restaurantId: restaurant.id,
        amount: chargeAmount,
        description: chargeDescription || undefined,
        readerId: selectedReaderId || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const selectedReader = readers.find((r: any) => r.id === selectedReaderId);
      const readerName = selectedReader?.label || selectedReader?.deviceType || selectedReaderId;

      if (data.readerAction && !data.readerAction.error) {
        setPendingPayment({
          paymentIntentId: data.paymentIntentId,
          amount: chargeAmount,
          description: chargeDescription || "In-person payment",
          readerLabel: readerName,
        });
        startPolling(data.paymentIntentId);
        toast({
          title: "Payment Sent to Reader",
          description: `Waiting for customer to tap or insert card on "${readerName}"...`,
        });
      } else if (data.readerAction?.error) {
        toast({
          title: t("common.error"),
          description: `Payment created but failed to send to reader: ${data.readerAction.error}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("terminal.chargeCreated"),
          description: `${t("terminal.paymentIntentId")}: ${data.paymentIntentId}`,
        });
      }
      setChargeAmount("");
      setChargeDescription("");
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("terminal.chargeCreateFailed"), variant: "destructive" });
    },
  });

  const readers = readersQuery.data?.readers || [];
  const onlineReaders = readers.filter((r: any) => r.status === "online");
  const offlineReaders = readers.filter((r: any) => r.status !== "online");

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("terminal.title")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("terminal.description")}</p>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-base">{t("terminal.enableTerminal")}</Label>
              <p className="text-sm text-muted-foreground">{t("terminal.enableDesc")}</p>
            </div>
            <Switch
              checked={!!restaurant.terminalEnabled}
              onCheckedChange={(checked) => toggleTerminal.mutate(checked)}
              disabled={toggleTerminal.isPending}
              data-testid="switch-terminal-enabled"
            />
          </div>

          {restaurant.terminalEnabled && (
            <>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-base">{t("terminal.tipping")}</Label>
                    <p className="text-sm text-muted-foreground">{t("terminal.tippingDesc")}</p>
                  </div>
                  <Switch
                    checked={restaurant.terminalTippingEnabled !== false}
                    onCheckedChange={async (checked) => {
                      try {
                        await apiRequest("PATCH", "/api/terminal/settings", {
                          restaurantId: restaurant.id,
                          terminalTippingEnabled: checked,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/vendor/restaurants"] });
                        toast({ title: checked ? t("terminal.tippingEnabled") : t("terminal.tippingDisabled") });
                      } catch {
                        toast({ title: t("common.error"), description: t("terminal.settingsUpdateFailed"), variant: "destructive" });
                      }
                    }}
                    data-testid="switch-terminal-tipping"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <Label className="text-base">{t("terminal.location")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.terminalLocationId
                        ? `${t("terminal.locationId")}: ${restaurant.terminalLocationId}`
                        : t("terminal.noLocation")}
                    </p>
                  </div>
                  {!restaurant.terminalLocationId && (
                    <div className="flex items-end gap-2 flex-wrap">
                      <div>
                        <Label htmlFor="terminal-zip">{t("terminal.zipCode")}</Label>
                        <Input
                          id="terminal-zip"
                          type="text"
                          placeholder="e.g. 90210"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                          maxLength={5}
                          className="w-28"
                          data-testid="input-terminal-zip"
                        />
                      </div>
                      <Button
                        onClick={() => setupLocation.mutate()}
                        disabled={setupLocation.isPending || postalCode.length !== 5}
                        data-testid="button-setup-terminal-location"
                      >
                        {setupLocation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <MapPin className="h-4 w-4 mr-2" />
                        {t("terminal.setupLocation")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <Label className="text-base">{t("terminal.connectedReaders")}</Label>
                    <p className="text-sm text-muted-foreground">{t("terminal.readersDesc")}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => readersQuery.refetch()}
                    disabled={readersQuery.isFetching}
                    data-testid="button-refresh-readers"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${readersQuery.isFetching ? "animate-spin" : ""}`} />
                    {t("common.refresh")}
                  </Button>
                </div>

                {readersQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : readers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("terminal.noReaders")}</p>
                    <p className="text-xs mt-1">{t("terminal.noReadersHint")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {readers.map((reader: any) => (
                      <div
                        key={reader.id}
                        className="flex items-center justify-between gap-4 p-3 border rounded-md flex-wrap"
                        data-testid={`reader-card-${reader.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{reader.label || reader.deviceType}</p>
                            <p className="text-xs text-muted-foreground">
                              {reader.serialNumber}
                              {reader.deviceType ? ` \u00b7 ${reader.deviceType}` : ""}
                              {reader.ipAddress ? ` \u00b7 ${reader.ipAddress}` : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant={reader.status === "online" ? "default" : "secondary"}>
                          {reader.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Label className="text-base mb-1 block">{t("terminal.createCharge")}</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Create a payment and send it to a card reader for the customer to pay.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="terminal-amount">{t("terminal.amount")}</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="terminal-amount"
                        type="number"
                        step="0.01"
                        min="0.50"
                        placeholder="0.00"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="pl-9"
                        data-testid="input-terminal-amount"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="terminal-description">{t("terminal.chargeDescription")}</Label>
                    <Input
                      id="terminal-description"
                      placeholder={t("terminal.chargeDescPlaceholder")}
                      value={chargeDescription}
                      onChange={(e) => setChargeDescription(e.target.value)}
                      className="mt-1.5"
                      data-testid="input-terminal-description"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Send to Reader</Label>
                  <Select value={selectedReaderId} onValueChange={setSelectedReaderId}>
                    <SelectTrigger className="mt-1.5" data-testid="select-terminal-reader">
                      <SelectValue placeholder={readers.length === 0 ? "No readers available" : "Select a card reader"} />
                    </SelectTrigger>
                    <SelectContent>
                      {onlineReaders.map((reader: any) => (
                        <SelectItem key={reader.id} value={reader.id} data-testid={`select-reader-${reader.id}`}>
                          <div className="flex items-center gap-2">
                            <span>{reader.label || reader.deviceType}</span>
                            <span className="text-xs text-muted-foreground">
                              {reader.ipAddress ? `(${reader.ipAddress})` : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {offlineReaders.map((reader: any) => (
                        <SelectItem key={reader.id} value={reader.id} disabled data-testid={`select-reader-${reader.id}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{reader.label || reader.deviceType} (offline)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedReaderId && readers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select an online reader to display the payment on the device
                    </p>
                  )}
                </div>
                {chargeAmount && parseFloat(chargeAmount) >= 0.5 && !pendingPayment && (
                  <div className="mt-3 p-3 border rounded-md bg-muted/30">
                    <div className="flex items-center justify-between gap-4 text-sm flex-wrap">
                      <span>Total: <strong>${parseFloat(chargeAmount).toFixed(2)}</strong></span>
                      <span className="text-muted-foreground">Platform fee (8%): ${(parseFloat(chargeAmount) * 0.08).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {pendingPayment ? (
                  <div className="mt-3 p-4 border rounded-md" data-testid="terminal-pending-payment">
                    {paymentStatus === "waiting_for_card" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <div>
                            <p className="font-medium">Waiting for card...</p>
                            <p className="text-sm text-muted-foreground">
                              Customer should tap or insert card on "{pendingPayment.readerLabel}"
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm p-2 bg-muted/30 rounded flex-wrap">
                          <span>Amount: <strong>${parseFloat(pendingPayment.amount).toFixed(2)}</strong></span>
                          <span className="text-muted-foreground">{pendingPayment.description}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelPendingPayment}
                          data-testid="button-cancel-terminal-payment"
                        >
                          Cancel Payment
                        </Button>
                      </div>
                    )}
                    {paymentStatus === "capturing" && (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                          <p className="font-medium">Card detected - capturing payment...</p>
                          <p className="text-sm text-muted-foreground">Please wait while we finalize the transaction.</p>
                        </div>
                      </div>
                    )}
                    {paymentStatus === "completed" && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-600">Payment Completed</p>
                          <p className="text-sm text-muted-foreground">
                            ${parseFloat(pendingPayment.amount).toFixed(2)} captured successfully.
                          </p>
                          {capturedTipAmount > 0 && (
                            <p className="text-sm text-green-600 font-medium">
                              {t("terminal.tipIncluded")}: ${(capturedTipAmount / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {paymentStatus === "capture_failed" && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-medium text-destructive">{t("terminal.captureFailed") || "Capture Failed"}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("terminal.captureFailedDesc") || "The payment was authorized but failed to capture. Please try again."}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={retryCapture}
                            disabled={paymentStatus === "capturing"}
                            data-testid="button-retry-capture"
                          >
                            {t("terminal.retryCapture") || "Retry Capture"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setPendingPayment(null); setPaymentStatus(""); }}
                            disabled={paymentStatus === "capturing"}
                            data-testid="button-dismiss-capture-error"
                          >
                            {t("common.dismiss") || "Dismiss"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {paymentStatus === "payment_failed" && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-medium text-destructive">{t("terminal.paymentFailed") || "Payment Failed"}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("terminal.cardDeclined") || "Card was declined or removed. Please try again."}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPendingPayment(null); setPaymentStatus(""); }}
                          data-testid="button-dismiss-payment-error"
                        >
                          {t("common.dismiss") || "Dismiss"}
                        </Button>
                      </div>
                    )}
                    {paymentStatus === "cancelled" && (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Payment Cancelled</p>
                        </div>
                      </div>
                    )}
                    {paymentStatus === "timed_out" && (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium text-destructive">Payment Timed Out</p>
                          <p className="text-sm text-muted-foreground">
                            No card was detected within 5 minutes. The payment intent is still open in Stripe.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => createCharge.mutate()}
                    disabled={createCharge.isPending || !chargeAmount || parseFloat(chargeAmount) < 0.5 || !selectedReaderId}
                    className="mt-3"
                    data-testid="button-create-terminal-charge"
                  >
                    {createCharge.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <CreditCard className="h-4 w-4 mr-2" />
                    Send Payment to Reader
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
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
