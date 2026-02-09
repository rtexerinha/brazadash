import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";
import { Briefcase, Plus, Star, Calendar, DollarSign, Users, Loader2, Check, X, Upload, ImageIcon, XCircle, Filter } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, isWithinInterval, addDays, addWeeks, addMonths } from "date-fns";
import { z } from "zod";
import type { ServiceProvider, Service, Booking } from "@shared/schema";

const providerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  languages: z.string().optional(),
  yearsExperience: z.string().optional(),
  priceRange: z.string().optional(),
});

const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  priceType: z.string().optional(),
  duration: z.string().optional(),
});

const categories = [
  "cleaning", "beauty", "auto", "legal", "immigration",
  "fitness", "education", "construction", "photography", "translation", "other"
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function CreateProviderDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof providerSchema>>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      businessName: "",
      description: "",
      category: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      website: "",
      languages: "Portuguese, English",
      yearsExperience: "",
      priceRange: "$$",
    },
  });

  const createProvider = useMutation({
    mutationFn: async (data: z.infer<typeof providerSchema>) => {
      return apiRequest("POST", "/api/provider/profile", {
        ...data,
        yearsExperience: data.yearsExperience ? parseInt(data.yearsExperience) : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/profile"] });
      toast({ title: "Profile created!", description: "Your service provider profile is now live." });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create profile.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-provider">
          <Plus className="mr-2 h-4 w-4" />
          Become a Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Provider Profile</DialogTitle>
          <DialogDescription>Set up your service provider profile on BrazaDash</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createProvider.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-provider-name" />
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-provider-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" data-testid="input-provider-description" />
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
                      <Input {...field} placeholder="Los Angeles, CA" data-testid="input-provider-city" />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-provider-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Portuguese, English" data-testid="input-provider-languages" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createProvider.isPending} data-testid="button-submit-provider">
                {createProvider.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Profile
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddServiceDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      priceType: "fixed",
      duration: "",
    },
  });

  const createService = useMutation({
    mutationFn: async (data: z.infer<typeof serviceSchema>) => {
      return apiRequest("POST", "/api/provider/services", {
        ...data,
        duration: data.duration ? parseInt(data.duration) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/services"] });
      toast({ title: "Service added!" });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add service.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-service">
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createService.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-service-name" />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" data-testid="input-service-description" />
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
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" data-testid="input-service-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-price-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="quote">Quote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" data-testid="input-service-duration" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createService.isPending} data-testid="button-submit-service">
                {createService.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Service
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ProviderDashboard({ provider }: { provider: ServiceProvider }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/provider/services"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/provider/bookings"],
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/provider/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bookings"] });
      toast({ title: t("provider.bookingUpdated") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("provider.bookingUpdateFailed"), variant: "destructive" });
    },
  });

  const filteredBookings = (bookings || []).filter(b => {
    if (dateFilter === "all") return true;
    const bookingDate = b.requestedDate ? new Date(b.requestedDate) : null;
    if (!bookingDate) return false;
    const now = new Date();
    if (dateFilter === "today") {
      const start = startOfDay(now);
      const end = addDays(start, 1);
      return isWithinInterval(bookingDate, { start, end });
    }
    if (dateFilter === "week") {
      const start = startOfWeek(now);
      const end = addWeeks(start, 1);
      return isWithinInterval(bookingDate, { start, end });
    }
    if (dateFilter === "month") {
      const start = startOfMonth(now);
      const end = addMonths(start, 1);
      return isWithinInterval(bookingDate, { start, end });
    }
    return true;
  });

  const pendingBookings = bookings?.filter(b => b.status === "pending") || [];
  const activeBookings = bookings?.filter(b => ["accepted", "confirmed", "in_progress"].includes(b.status)) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(provider.rating || "0").toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{provider.reviewCount || 0}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
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
                <p className="text-2xl font-bold">{services?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings" data-testid="tab-bookings">
            Bookings ({bookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">
            Services ({services?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("all")}
              data-testid="filter-all"
            >
              {t("provider.filterAll")}
            </Button>
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("today")}
              data-testid="filter-today"
            >
              {t("provider.filterToday")}
            </Button>
            <Button
              variant={dateFilter === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("week")}
              data-testid="filter-week"
            >
              {t("provider.filterWeek")}
            </Button>
            <Button
              variant={dateFilter === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("month")}
              data-testid="filter-month"
            >
              {t("provider.filterMonth")}
            </Button>
          </div>
          {bookingsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} data-testid={`provider-booking-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">Booking #{booking.id.slice(0, 8)}</span>
                          <Badge className={statusColors[booking.status]}>{booking.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {booking.requestedDate && (
                            <p>Date: {new Date(booking.requestedDate).toLocaleDateString()} {booking.requestedTime}</p>
                          )}
                          {booking.address && <p>Location: {booking.address}</p>}
                          {booking.notes && <p>Notes: {booking.notes}</p>}
                        </div>
                        <div className="mt-2 space-y-0.5">
                          {booking.price && parseFloat(booking.price) > 0 && (
                            <p className="text-sm text-muted-foreground">{t("booking.servicePrice")}: ${parseFloat(booking.price).toFixed(2)}</p>
                          )}
                          {booking.bookingFee && parseFloat(booking.bookingFee) > 0 && (
                            <p className="text-sm text-muted-foreground">{t("booking.bookingFee")}: ${parseFloat(booking.bookingFee).toFixed(2)}</p>
                          )}
                          {booking.totalPaid && parseFloat(booking.totalPaid) > 0 && (
                            <p className="font-semibold">{t("booking.totalPaid")}: ${parseFloat(booking.totalPaid).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateBooking.mutate({ id: booking.id, status: "accepted" })}
                              data-testid={`button-accept-${booking.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBooking.mutate({ id: booking.id, status: "declined" })}
                              data-testid={`button-decline-${booking.id}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}
                        {booking.status === "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => updateBooking.mutate({ id: booking.id, status: "confirmed" })}
                          >
                            Confirm
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => updateBooking.mutate({ id: booking.id, status: "in_progress" })}
                          >
                            Start Service
                          </Button>
                        )}
                        {booking.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => updateBooking.mutate({ id: booking.id, status: "completed" })}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No bookings yet</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <div className="flex justify-end mb-4">
            <AddServiceDialog onSuccess={() => {}} />
          </div>
          {servicesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} data-testid={`provider-service-${service.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        {service.duration && (
                          <p className="text-sm text-muted-foreground mt-1">{service.duration} minutes</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${parseFloat(service.price || "0").toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{service.priceType}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No services added yet</p>
              <AddServiceDialog onSuccess={() => {}} />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <ProviderImageSettings provider={provider} />
          <ProviderBankSettings provider={provider} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderImageSettings({ provider }: { provider: ServiceProvider }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(provider.imageUrl || null);
  const [gallery, setGallery] = useState<string[]>((provider.galleryImages as string[]) || []);
  const [uploading, setUploading] = useState(false);

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
      return apiRequest("PATCH", "/api/provider/profile", { imageUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/profile"] });
      toast({ title: t("settings.logoSaved") });
    },
  });

  const saveGallery = useMutation({
    mutationFn: async (images: string[]) => {
      return apiRequest("PATCH", "/api/provider/profile", { galleryImages: images });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/profile"] });
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
        <p className="text-sm text-muted-foreground mb-6">
          {t("settings.businessImagesDesc")}
        </p>

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
                    data-testid="button-provider-remove-logo"
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
                  data-testid="input-provider-logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading || saveLogo.isPending}
                  data-testid="button-provider-upload-logo"
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
                    data-testid={`button-provider-remove-gallery-${i}`}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
              <div
                className="aspect-video rounded-md border border-dashed flex flex-col items-center justify-center cursor-pointer bg-muted/30 hover-elevate"
                onClick={() => galleryInputRef.current?.click()}
                data-testid="button-provider-add-gallery-photo"
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
              data-testid="input-provider-gallery-upload"
            />
            <p className="text-xs text-muted-foreground">{t("settings.galleryDesc")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderBankSettings({ provider }: { provider: ServiceProvider }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bookingFeeAmount, setBookingFeeAmount] = useState(provider.bookingFee || "0");
  const [bankName, setBankName] = useState(provider.bankName || "");
  const [routingNumber, setRoutingNumber] = useState(provider.routingNumber || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(provider.bankAccountNumber || "");
  const [zelleInfo, setZelleInfo] = useState(provider.zelleInfo || "");
  const [venmoInfo, setVenmoInfo] = useState(provider.venmoInfo || "");

  const updateBankInfo = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/provider/profile", {
        bookingFee: bookingFeeAmount || "0",
        bankName: bankName || null,
        routingNumber: routingNumber || null,
        bankAccountNumber: bankAccountNumber || null,
        zelleInfo: zelleInfo || null,
        venmoInfo: venmoInfo || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/profile"] });
      toast({ title: t("settings.paymentInfoSaved"), description: t("settings.paymentInfoSavedDesc") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("settings.paymentInfoFailed"), variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{t("settings.paymentInfo")}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t("settings.paymentInfoDesc")}
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider-settings-booking-fee">{t("settings.bookingFeeLabel")}</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-medium">$</span>
              <Input
                id="provider-settings-booking-fee"
                type="number"
                min="0"
                step="0.01"
                value={bookingFeeAmount}
                onChange={(e) => setBookingFeeAmount(e.target.value)}
                placeholder="0.00"
                className="max-w-[200px]"
                data-testid="input-provider-booking-fee"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("settings.bookingFeeDesc")}</p>
          </div>
          <div className="border-t pt-4">
            <Label htmlFor="provider-settings-bank-name">{t("onboarding.bankName")}</Label>
            <Input
              id="provider-settings-bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={t("onboarding.bankNamePlaceholder")}
              className="mt-1.5"
              data-testid="input-provider-settings-bank-name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider-settings-routing">{t("onboarding.routingNumber")}</Label>
              <Input
                id="provider-settings-routing"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder={t("onboarding.routingNumberPlaceholder")}
                className="mt-1.5"
                data-testid="input-provider-settings-routing"
              />
            </div>
            <div>
              <Label htmlFor="provider-settings-account">{t("onboarding.bankAccountNumber")}</Label>
              <Input
                id="provider-settings-account"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder={t("onboarding.bankAccountPlaceholder")}
                className="mt-1.5"
                data-testid="input-provider-settings-account"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider-settings-zelle">{t("onboarding.zelleInfo")}</Label>
              <Input
                id="provider-settings-zelle"
                value={zelleInfo}
                onChange={(e) => setZelleInfo(e.target.value)}
                placeholder={t("onboarding.zelleInfoPlaceholder")}
                className="mt-1.5"
                data-testid="input-provider-settings-zelle"
              />
            </div>
            <div>
              <Label htmlFor="provider-settings-venmo">{t("onboarding.venmoInfo")}</Label>
              <Input
                id="provider-settings-venmo"
                value={venmoInfo}
                onChange={(e) => setVenmoInfo(e.target.value)}
                placeholder={t("onboarding.venmoInfoPlaceholder")}
                className="mt-1.5"
                data-testid="input-provider-settings-venmo"
              />
            </div>
          </div>
          <Button
            onClick={() => updateBankInfo.mutate()}
            disabled={updateBankInfo.isPending}
            data-testid="button-provider-save-bank-info"
          >
            {updateBankInfo.isPending ? t("common.saving") : t("vendor.saveBankInfo")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProviderPortalPage() {
  const { data: provider, isLoading } = useQuery<ServiceProvider | null>({
    queryKey: ["/api/provider/profile"],
  });

  if (isLoading) {
    return (
      <div className="container py-6 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Provider Portal</h1>
          <p className="text-muted-foreground">Manage your services and bookings</p>
        </div>
        {!provider && <CreateProviderDialog onSuccess={() => {}} />}
      </div>

      {provider ? (
        <ProviderDashboard provider={provider} />
      ) : (
        <Card className="p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Become a Service Provider</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Join BrazaDash and offer your services to the Brazilian community in California.
          </p>
          <CreateProviderDialog onSuccess={() => {}} />
        </Card>
      )}
    </div>
  );
}
