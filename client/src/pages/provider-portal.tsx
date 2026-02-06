import { useState } from "react";
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
import { Briefcase, Plus, Star, Calendar, DollarSign, Users, Loader2, Check, X } from "lucide-react";
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
  const { toast } = useToast();

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
      toast({ title: "Booking updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" });
    },
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
          {bookingsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
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
                        {booking.price && (
                          <p className="font-semibold mt-2">${parseFloat(booking.price).toFixed(2)}</p>
                        )}
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

        <TabsContent value="settings" className="mt-6">
          <ProviderBankSettings provider={provider} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderBankSettings({ provider }: { provider: ServiceProvider }) {
  const { toast } = useToast();
  const [bankName, setBankName] = useState(provider.bankName || "");
  const [routingNumber, setRoutingNumber] = useState(provider.routingNumber || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(provider.bankAccountNumber || "");
  const [zelleInfo, setZelleInfo] = useState(provider.zelleInfo || "");
  const [venmoInfo, setVenmoInfo] = useState(provider.venmoInfo || "");

  const updateBankInfo = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/provider/profile", {
        bankName: bankName || null,
        routingNumber: routingNumber || null,
        bankAccountNumber: bankAccountNumber || null,
        zelleInfo: zelleInfo || null,
        venmoInfo: venmoInfo || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/profile"] });
      toast({ title: "Payment info saved", description: "Your payment information has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save payment info.", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Provide your bank details so you can receive payments from bookings.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider-settings-bank-name">Bank Name</Label>
            <Input
              id="provider-settings-bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Bank of America, Chase"
              className="mt-1.5"
              data-testid="input-provider-settings-bank-name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider-settings-routing">Routing Number</Label>
              <Input
                id="provider-settings-routing"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="9-digit routing number"
                className="mt-1.5"
                data-testid="input-provider-settings-routing"
              />
            </div>
            <div>
              <Label htmlFor="provider-settings-account">Account Number</Label>
              <Input
                id="provider-settings-account"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Bank account number"
                className="mt-1.5"
                data-testid="input-provider-settings-account"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider-settings-zelle">Zelle (Email or Phone)</Label>
              <Input
                id="provider-settings-zelle"
                value={zelleInfo}
                onChange={(e) => setZelleInfo(e.target.value)}
                placeholder="Zelle email or phone number"
                className="mt-1.5"
                data-testid="input-provider-settings-zelle"
              />
            </div>
            <div>
              <Label htmlFor="provider-settings-venmo">Venmo Username</Label>
              <Input
                id="provider-settings-venmo"
                value={venmoInfo}
                onChange={(e) => setVenmoInfo(e.target.value)}
                placeholder="@username"
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
            {updateBankInfo.isPending ? "Saving..." : "Save Payment Info"}
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
