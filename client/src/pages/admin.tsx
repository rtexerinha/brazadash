import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Restaurant, Order, ServiceProvider, Booking, Event, Business, Announcement, Review } from "@shared/schema";
import {
  Users, Store, ShoppingBag, Briefcase, Calendar, Building2, Megaphone, 
  Star, DollarSign, TrendingUp, CheckCircle, XCircle, Shield, Plus, AlertTriangle
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalProviders: number;
  totalBookings: number;
  totalEvents: number;
  totalBusinesses: number;
  revenue: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    type: "news" as "news" | "promo" | "update" | "alert",
    linkUrl: "",
    linkText: "",
    isPinned: false,
  });

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/admin/restaurants"],
    enabled: activeTab === "restaurants" && !accessDenied,
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: activeTab === "orders" && !accessDenied,
  });

  const { data: providers } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/admin/providers"],
    enabled: activeTab === "providers" && !accessDenied,
  });

  const { data: bookingsData } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    enabled: activeTab === "bookings" && !accessDenied,
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    enabled: activeTab === "events" && !accessDenied,
  });

  const { data: businessesData } = useQuery<Business[]>({
    queryKey: ["/api/admin/businesses"],
    enabled: activeTab === "businesses" && !accessDenied,
  });

  const { data: announcementsData } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: activeTab === "announcements" && !accessDenied,
  });

  const { data: reviewsData } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
    enabled: activeTab === "reviews" && !accessDenied,
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Restaurant> }) => {
      const res = await apiRequest("PATCH", `/api/admin/restaurants/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Restaurant updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceProvider> }) => {
      const res = await apiRequest("PATCH", `/api/admin/providers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Provider updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      const res = await apiRequest("PATCH", `/api/admin/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Event updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Business> }) => {
      const res = await apiRequest("PATCH", `/api/admin/businesses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Business updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: typeof newAnnouncement) => {
      const res = await apiRequest("POST", "/api/admin/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Created", description: "Announcement created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setShowAnnouncementDialog(false);
      setNewAnnouncement({
        title: "",
        content: "",
        type: "news",
        linkUrl: "",
        linkText: "",
        isPinned: false,
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Announcement deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/reviews/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Review removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
  });

  useEffect(() => {
    if (statsError) {
      setAccessDenied(true);
    }
  }, [statsError]);

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard. 
              This area is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage BrazaDash platform</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-1 mb-6 h-auto">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="tab-restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-providers">Providers</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
            <TabsTrigger value="businesses" data-testid="tab-businesses">Businesses</TabsTrigger>
            <TabsTrigger value="announcements" data-testid="tab-announcements">Announcements</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-users">{stats.totalUsers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-restaurants">{stats.totalRestaurants}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Food Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-orders">{stats.totalOrders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-providers">{stats.totalProviders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-bookings">{stats.totalBookings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Community Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-events">{stats.totalEvents}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-businesses">{stats.totalBusinesses}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-revenue">${stats.revenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="restaurants">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Management</CardTitle>
                <CardDescription>Manage all restaurants on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restaurants?.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-restaurant-${restaurant.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">{restaurant.cuisine} • {restaurant.city}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch
                            checked={restaurant.isActive || false}
                            onCheckedChange={(checked) => 
                              updateRestaurantMutation.mutate({ id: restaurant.id, data: { isActive: checked } })
                            }
                            data-testid={`switch-restaurant-active-${restaurant.id}`}
                          />
                        </div>
                        <Badge variant={restaurant.isOpen ? "default" : "secondary"}>
                          {restaurant.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View all food orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders?.slice(0, 20).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-order-${order.id}`}
                    >
                      <div>
                        <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          ${order.total} • {new Date(order.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        order.status === "delivered" ? "default" :
                        order.status === "cancelled" ? "destructive" :
                        "secondary"
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Service Provider Management</CardTitle>
                <CardDescription>Manage service providers and verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers?.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-provider-${provider.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{provider.businessName}</h3>
                        <p className="text-sm text-muted-foreground">{provider.category} • {provider.city}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Verified</span>
                          <Switch
                            checked={provider.isVerified || false}
                            onCheckedChange={(checked) => 
                              updateProviderMutation.mutate({ id: provider.id, data: { isVerified: checked } })
                            }
                            data-testid={`switch-provider-verified-${provider.id}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch
                            checked={provider.isActive || false}
                            onCheckedChange={(checked) => 
                              updateProviderMutation.mutate({ id: provider.id, data: { isActive: checked } })
                            }
                            data-testid={`switch-provider-active-${provider.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>View all service bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingsData?.slice(0, 20).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-booking-${booking.id}`}
                    >
                      <div>
                        <p className="font-mono text-sm">{booking.id.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.price ? `$${booking.price}` : "Quote"} • {new Date(booking.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        booking.status === "completed" ? "default" :
                        booking.status === "cancelled" || booking.status === "declined" ? "destructive" :
                        "secondary"
                      }>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
                <CardDescription>Approve and feature community events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events?.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-event-${event.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.category} • {new Date(event.eventDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Featured</span>
                          <Switch
                            checked={event.isFeatured || false}
                            onCheckedChange={(checked) => 
                              updateEventMutation.mutate({ id: event.id, data: { isFeatured: checked } })
                            }
                            data-testid={`switch-event-featured-${event.id}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Approved</span>
                          <Switch
                            checked={event.isApproved || false}
                            onCheckedChange={(checked) => 
                              updateEventMutation.mutate({ id: event.id, data: { isApproved: checked } })
                            }
                            data-testid={`switch-event-approved-${event.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses">
            <Card>
              <CardHeader>
                <CardTitle>Business Directory Management</CardTitle>
                <CardDescription>Manage and verify business listings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessesData?.map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-business-${business.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{business.name}</h3>
                        <p className="text-sm text-muted-foreground">{business.category} • {business.city}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Verified</span>
                          <Switch
                            checked={business.isVerified || false}
                            onCheckedChange={(checked) => 
                              updateBusinessMutation.mutate({ id: business.id, data: { isVerified: checked } })
                            }
                            data-testid={`switch-business-verified-${business.id}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch
                            checked={business.isActive || false}
                            onCheckedChange={(checked) => 
                              updateBusinessMutation.mutate({ id: business.id, data: { isActive: checked } })
                            }
                            data-testid={`switch-business-active-${business.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Create and manage platform announcements</CardDescription>
                </div>
                <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-announcement">
                      <Plus className="h-4 w-4 mr-2" />
                      New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Title"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                          data-testid="input-announcement-title"
                        />
                      </div>
                      <div>
                        <Textarea
                          placeholder="Content"
                          value={newAnnouncement.content}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                          data-testid="input-announcement-content"
                        />
                      </div>
                      <div>
                        <Select
                          value={newAnnouncement.type}
                          onValueChange={(value: "news" | "promo" | "update" | "alert") => 
                            setNewAnnouncement({ ...newAnnouncement, type: value })
                          }
                        >
                          <SelectTrigger data-testid="select-announcement-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="news">News</SelectItem>
                            <SelectItem value="promo">Promo</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="alert">Alert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newAnnouncement.isPinned}
                          onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, isPinned: checked })}
                          data-testid="switch-announcement-pinned"
                        />
                        <span className="text-sm">Pin this announcement</span>
                      </div>
                      <Button
                        onClick={() => createAnnouncementMutation.mutate(newAnnouncement)}
                        disabled={!newAnnouncement.title || !newAnnouncement.content || createAnnouncementMutation.isPending}
                        className="w-full"
                        data-testid="button-create-announcement"
                      >
                        Create Announcement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcementsData?.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-announcement-${announcement.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          {announcement.isPinned && <Badge variant="outline">Pinned</Badge>}
                          <Badge variant="secondary">{announcement.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{announcement.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                        disabled={deleteAnnouncementMutation.isPending}
                        data-testid={`button-delete-announcement-${announcement.id}`}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Moderation</CardTitle>
                <CardDescription>Moderate user reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewsData?.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`row-review-${review.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{review.comment || "No comment"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReviewMutation.mutate(review.id)}
                        disabled={deleteReviewMutation.isPending}
                        data-testid={`button-delete-review-${review.id}`}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {reviewsData?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No reviews to moderate</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
