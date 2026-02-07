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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Restaurant, Order, ServiceProvider, Booking, Event, Business, Announcement, Review, ServiceReview, YellowPage } from "@shared/schema";
import { Label } from "@/components/ui/label";
import {
  Users, Store, ShoppingBag, Briefcase, Calendar, Building2, Megaphone,
  Star, DollarSign, CheckCircle, XCircle, Shield, Plus, AlertTriangle,
  Trash2, UserPlus, UserMinus, Filter, X, Clock, ChevronLeft, ChevronRight,
  FileText, TrendingUp
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";

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

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface PendingApproval {
  id: string;
  userId: string;
  role: string;
  approvalStatus: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  businessInfo?: {
    name?: string;
    businessName?: string;
    description?: string;
    cuisine?: string;
    category?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
}

interface RestaurantDayBreakdown {
  day: string;
  date: string;
  orders: number;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
}

interface ProviderDayBreakdown {
  day: string;
  date: string;
  bookings: number;
  serviceRevenue: number;
  bookingFeeRevenue: number;
  totalPaid: number;
  platformFee: number;
  netPayout: number;
}

interface RestaurantReport {
  type: "restaurant";
  id: string;
  name: string;
  totalOrders: number;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
  dailyBreakdown: RestaurantDayBreakdown[];
}

interface ProviderReport {
  type: "provider";
  id: string;
  name: string;
  totalBookings: number;
  serviceRevenue: number;
  bookingFeeRevenue: number;
  totalPaid: number;
  platformFee: number;
  netPayout: number;
  dailyBreakdown: ProviderDayBreakdown[];
}

interface FinancialReport {
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
  restaurants: RestaurantReport[];
  providers: ProviderReport[];
  summary: {
    totalPlatformRevenue: number;
    totalPayouts: number;
    totalOrders: number;
    totalBookings: number;
  };
}

const ALL_ROLES = ["customer", "vendor", "service_provider", "admin"] as const;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [orderFilterRestaurant, setOrderFilterRestaurant] = useState<string>("all");
  const [orderFilterDateFrom, setOrderFilterDateFrom] = useState<string>("");
  const [orderFilterDateTo, setOrderFilterDateTo] = useState<string>("");
  const [expandedBusiness, setExpandedBusiness] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<string>("all");

  const getDateRange = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (preset) {
      case "today": {
        const d = today.toISOString().split("T")[0];
        return { startDate: d, endDate: d };
      }
      case "week": {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      }
      case "month": {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      }
      default:
        return null;
    }
  };

  const [datePreset, setDatePreset] = useState<string>("week");
  const defaultRange = getDateRange("week")!;
  const [customStartDate, setCustomStartDate] = useState(defaultRange.startDate);
  const [customEndDate, setCustomEndDate] = useState(defaultRange.endDate);

  const activeRange = datePreset === "custom"
    ? { startDate: customStartDate, endDate: customEndDate }
    : getDateRange(datePreset) || { startDate: customStartDate, endDate: customEndDate };
  const { t } = useLanguage();
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

  const { data: financialReport, isLoading: reportLoading } = useQuery<FinancialReport>({
    queryKey: ["/api/admin/financial-report", activeRange.startDate, activeRange.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/admin/financial-report?startDate=${activeRange.startDate}&endDate=${activeRange.endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: activeTab === "overview" && !accessDenied,
  });

  const { data: usersData } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users" && !accessDenied,
  });

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/admin/restaurants"],
    enabled: activeTab === "restaurants" && !accessDenied,
  });

  const { data: orders } = useQuery<(Order & { restaurant?: { name: string } })[]>({
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

  const { data: yellowPagesData } = useQuery<YellowPage[]>({
    queryKey: ["/api/admin/yellow-pages"],
    enabled: activeTab === "yellowpages" && !accessDenied,
  });

  const { data: announcementsData } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: activeTab === "announcements" && !accessDenied,
  });

  const { data: reviewsData } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
    enabled: activeTab === "reviews" && !accessDenied,
  });

  const { data: serviceReviewsData } = useQuery<ServiceReview[]>({
    queryKey: ["/api/admin/service-reviews"],
    enabled: activeTab === "reviews" && !accessDenied,
  });

  const { data: pendingApprovals } = useQuery<PendingApproval[]>({
    queryKey: ["/api/admin/pending-approvals"],
    enabled: (activeTab === "approvals" || activeTab === "overview") && !accessDenied,
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ userId, role, status }: { userId: string; role: string; status: "approved" | "rejected" }) => {
      const res = await apiRequest("PATCH", "/api/admin/approve-role", { userId, role, status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: variables.status === "approved" ? "Approved" : "Rejected", description: `Registration ${variables.status} successfully` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update approval status", variant: "destructive" });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role, action }: { id: string; role: string; action: "add" | "remove" }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/roles`, { role, action });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "User role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
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

  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/restaurants/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Restaurant deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/providers/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Provider deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/events/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Event deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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

  const deleteBusinessMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/businesses/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Business deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/businesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const updateYellowPageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<YellowPage> }) => {
      const res = await apiRequest("PATCH", `/api/admin/yellow-pages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Listing updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/yellow-pages"] });
    },
  });

  const deleteYellowPageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/yellow-pages/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Listing deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/yellow-pages"] });
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

  const deleteServiceReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/service-reviews/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Service review removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-reviews"] });
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
          <TabsList className="grid grid-cols-5 lg:grid-cols-11 gap-1 mb-6 h-auto">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals" data-testid="tab-approvals" className="relative">
              Approvals
              {pendingApprovals && pendingApprovals.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="tab-restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-providers">Providers</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
            <TabsTrigger value="yellowpages" data-testid="tab-yellowpages">Yellow Pages</TabsTrigger>
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
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-users">{stats.totalUsers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-restaurants">{stats.totalRestaurants}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Food Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-orders">{stats.totalOrders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-providers">{stats.totalProviders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-bookings">{stats.totalBookings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Community Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-events">{stats.totalEvents}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-businesses">{stats.totalBusinesses}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-revenue">${stats.revenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {pendingApprovals && pendingApprovals.length > 0 && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription>{pendingApprovals.length} registration(s) awaiting review</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("approvals")} data-testid="button-view-all-approvals">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingApprovals.slice(0, 3).map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between gap-4 p-3 rounded-md border">
                        <div>
                          <p className="font-medium" data-testid={`text-approval-name-${approval.id}`}>{approval.userName}</p>
                          <p className="text-sm text-muted-foreground">{approval.userEmail}</p>
                          {approval.businessInfo && (
                            <p className="text-sm font-medium text-primary mt-1" data-testid={`text-approval-business-${approval.id}`}>
                              {approval.businessInfo.name || approval.businessInfo.businessName}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-1">
                            {approval.role === "vendor" ? "Restaurant / Food Vendor" : "Service Provider"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approvalMutation.mutate({ userId: approval.userId, role: approval.role, status: "approved" })}
                            disabled={approvalMutation.isPending}
                            data-testid={`button-approve-${approval.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approvalMutation.mutate({ userId: approval.userId, role: approval.role, status: "rejected" })}
                            disabled={approvalMutation.isPending}
                            data-testid={`button-reject-${approval.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Report */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t("admin.financialReport")}
                      </CardTitle>
                      <CardDescription>
                        {t("admin.financialReportDesc")}
                      </CardDescription>
                    </div>
                    <span className="text-sm font-medium" data-testid="text-date-range">
                      {activeRange.startDate === activeRange.endDate
                        ? activeRange.startDate
                        : `${activeRange.startDate} — ${activeRange.endDate}`}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <div className="flex gap-1 flex-wrap">
                      {(["today", "week", "month", "custom"] as const).map((preset) => (
                        <Button
                          key={preset}
                          variant={datePreset === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setDatePreset(preset);
                            if (preset !== "custom") {
                              const range = getDateRange(preset);
                              if (range) {
                                setCustomStartDate(range.startDate);
                                setCustomEndDate(range.endDate);
                              }
                            }
                          }}
                          data-testid={`button-preset-${preset}`}
                        >
                          {t(`admin.preset${preset.charAt(0).toUpperCase() + preset.slice(1)}`)}
                        </Button>
                      ))}
                    </div>

                    {datePreset === "custom" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-auto"
                          data-testid="input-start-date"
                        />
                        <span className="text-sm text-muted-foreground">{t("admin.to")}</span>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-auto"
                          data-testid="input-end-date"
                        />
                      </div>
                    )}

                    <Select value={reportFilter} onValueChange={setReportFilter}>
                      <SelectTrigger className="w-auto min-w-[180px]" data-testid="select-report-filter">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t("admin.filterBusiness")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.allBusinesses")}</SelectItem>
                        {financialReport?.restaurants.map(r => (
                          <SelectItem key={`r-${r.id}`} value={`restaurant-${r.id}`}>{r.name}</SelectItem>
                        ))}
                        {financialReport?.providers.map(p => (
                          <SelectItem key={`p-${p.id}`} value={`provider-${p.id}`}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : financialReport ? (
                  <div className="space-y-6">
                    {(() => {
                      const filteredRestaurants = reportFilter === "all"
                        ? financialReport.restaurants
                        : reportFilter.startsWith("restaurant-")
                          ? financialReport.restaurants.filter(r => r.id === reportFilter.replace("restaurant-", ""))
                          : [];
                      const filteredProviders = reportFilter === "all"
                        ? financialReport.providers
                        : reportFilter.startsWith("provider-")
                          ? financialReport.providers.filter(p => p.id === reportFilter.replace("provider-", ""))
                          : [];

                      const summaryOrders = filteredRestaurants.reduce((s, r) => s + r.totalOrders, 0);
                      const summaryBookings = filteredProviders.reduce((s, p) => s + p.totalBookings, 0);
                      const summaryPlatformRev = filteredRestaurants.reduce((s, r) => s + r.platformFee, 0)
                        + filteredProviders.reduce((s, p) => s + p.platformFee, 0);
                      const summaryPayouts = filteredRestaurants.reduce((s, r) => s + r.netPayout, 0)
                        + filteredProviders.reduce((s, p) => s + p.netPayout, 0);

                      return (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">{t("admin.orders")}</p>
                                <p className="text-2xl font-bold" data-testid="text-summary-orders">{summaryOrders}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">{t("admin.bookings")}</p>
                                <p className="text-2xl font-bold" data-testid="text-summary-bookings">{summaryBookings}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">{t("admin.platformRevenue")}</p>
                                <p className="text-2xl font-bold text-green-600" data-testid="text-platform-revenue">
                                  ${summaryPlatformRev.toFixed(2)}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">{t("admin.totalPayouts")}</p>
                                <p className="text-2xl font-bold" data-testid="text-total-payouts">
                                  ${summaryPayouts.toFixed(2)}
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          {filteredRestaurants.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                {t("admin.restaurantPayouts")}
                              </h3>
                              <div className="space-y-3">
                                {filteredRestaurants.map(r => (
                                  <Card key={r.id} data-testid={`report-restaurant-${r.id}`}>
                                    <CardContent className="p-4">
                                      <div
                                        className="flex items-center justify-between gap-4 cursor-pointer flex-wrap"
                                        onClick={() => setExpandedBusiness(expandedBusiness === r.id ? null : r.id)}
                                        data-testid={`button-expand-${r.id}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Store className="h-4 w-4 text-muted-foreground" />
                                          <div>
                                            <p className="font-medium">{r.name}</p>
                                            <p className="text-sm text-muted-foreground">{r.totalOrders} {t("admin.ordersPeriod")}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-6 flex-wrap">
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{t("admin.grossRevenue")}</p>
                                            <p className="font-medium">${r.grossRevenue.toFixed(2)}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{t("admin.platformFee8")}</p>
                                            <p className="font-medium text-green-600">${r.platformFee.toFixed(2)}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{t("admin.netPayout")}</p>
                                            <p className="font-bold">${r.netPayout.toFixed(2)}</p>
                                          </div>
                                          <ChevronRight className={`h-4 w-4 transition-transform ${expandedBusiness === r.id ? "rotate-90" : ""}`} />
                                        </div>
                                      </div>
                                      {expandedBusiness === r.id && (
                                        <div className="mt-4 overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="border-b">
                                                <th className="text-left py-2 pr-4 font-medium">{t("admin.day")}</th>
                                                <th className="text-left py-2 pr-4 font-medium">{t("admin.date")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.colOrders")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.gross")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.fee")}</th>
                                                <th className="text-right py-2 font-medium">{t("admin.colPayout")}</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {r.dailyBreakdown.map(day => (
                                                <tr key={day.date} className="border-b last:border-0">
                                                  <td className="py-2 pr-4">{day.day}</td>
                                                  <td className="py-2 pr-4 text-muted-foreground">{day.date}</td>
                                                  <td className="py-2 pr-4 text-right">{day.orders}</td>
                                                  <td className="py-2 pr-4 text-right">${day.grossRevenue.toFixed(2)}</td>
                                                  <td className="py-2 pr-4 text-right text-green-600">${day.platformFee.toFixed(2)}</td>
                                                  <td className="py-2 text-right font-medium">${day.netPayout.toFixed(2)}</td>
                                                </tr>
                                              ))}
                                              <tr className="font-bold border-t-2">
                                                <td className="py-2 pr-4" colSpan={2}>{t("admin.periodTotal")}</td>
                                                <td className="py-2 pr-4 text-right">{r.totalOrders}</td>
                                                <td className="py-2 pr-4 text-right">${r.grossRevenue.toFixed(2)}</td>
                                                <td className="py-2 pr-4 text-right text-green-600">${r.platformFee.toFixed(2)}</td>
                                                <td className="py-2 text-right">${r.netPayout.toFixed(2)}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {filteredProviders.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                {t("admin.providerPayouts")}
                              </h3>
                              <div className="space-y-3">
                                {filteredProviders.map(p => (
                                  <Card key={p.id} data-testid={`report-provider-${p.id}`}>
                                    <CardContent className="p-4">
                                      <div
                                        className="flex items-center justify-between gap-4 cursor-pointer flex-wrap"
                                        onClick={() => setExpandedBusiness(expandedBusiness === p.id ? null : p.id)}
                                        data-testid={`button-expand-${p.id}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                                          <div>
                                            <p className="font-medium">{p.name}</p>
                                            <p className="text-sm text-muted-foreground">{p.totalBookings} {t("admin.bookingsPeriod")}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-6 flex-wrap">
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{t("admin.totalCollected")}</p>
                                            <p className="font-medium">${p.totalPaid.toFixed(2)}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{t("admin.platformFee8")}</p>
                                            <p className="font-medium text-green-600">${p.platformFee.toFixed(2)}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{t("admin.netPayout")}</p>
                                            <p className="font-bold">${p.netPayout.toFixed(2)}</p>
                                          </div>
                                          <ChevronRight className={`h-4 w-4 transition-transform ${expandedBusiness === p.id ? "rotate-90" : ""}`} />
                                        </div>
                                      </div>
                                      {expandedBusiness === p.id && (
                                        <div className="mt-4 overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="border-b">
                                                <th className="text-left py-2 pr-4 font-medium">{t("admin.day")}</th>
                                                <th className="text-left py-2 pr-4 font-medium">{t("admin.date")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.colBookings")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.colServices")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.bookingFees")}</th>
                                                <th className="text-right py-2 pr-4 font-medium">{t("admin.fee")}</th>
                                                <th className="text-right py-2 font-medium">{t("admin.colPayout")}</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {p.dailyBreakdown.map(day => (
                                                <tr key={day.date} className="border-b last:border-0">
                                                  <td className="py-2 pr-4">{day.day}</td>
                                                  <td className="py-2 pr-4 text-muted-foreground">{day.date}</td>
                                                  <td className="py-2 pr-4 text-right">{day.bookings}</td>
                                                  <td className="py-2 pr-4 text-right">${day.serviceRevenue.toFixed(2)}</td>
                                                  <td className="py-2 pr-4 text-right">${day.bookingFeeRevenue.toFixed(2)}</td>
                                                  <td className="py-2 pr-4 text-right text-green-600">${day.platformFee.toFixed(2)}</td>
                                                  <td className="py-2 text-right font-medium">${day.netPayout.toFixed(2)}</td>
                                                </tr>
                                              ))}
                                              <tr className="font-bold border-t-2">
                                                <td className="py-2 pr-4" colSpan={2}>{t("admin.periodTotal")}</td>
                                                <td className="py-2 pr-4 text-right">{p.totalBookings}</td>
                                                <td className="py-2 pr-4 text-right">${p.serviceRevenue.toFixed(2)}</td>
                                                <td className="py-2 pr-4 text-right">${p.bookingFeeRevenue.toFixed(2)}</td>
                                                <td className="py-2 pr-4 text-right text-green-600">${p.platformFee.toFixed(2)}</td>
                                                <td className="py-2 text-right">${p.netPayout.toFixed(2)}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {filteredRestaurants.every(r => r.totalOrders === 0) && 
                           filteredProviders.every(p => p.totalBookings === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                              <p>{t("admin.noTransactionsPeriod")}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Business Registrations
                </CardTitle>
                <CardDescription>
                  Review and approve or reject vendor and service provider registrations.
                  Customers are automatically approved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pendingApprovals || pendingApprovals.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">All Caught Up</h3>
                    <p className="text-muted-foreground">No pending registrations to review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((approval) => (
                      <div key={approval.id} className="p-4 rounded-md border" data-testid={`card-approval-${approval.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium" data-testid={`text-approval-name-full-${approval.id}`}>{approval.userName}</p>
                              <Badge variant="outline">
                                {approval.role === "vendor" ? "Restaurant / Food Vendor" : "Service Provider"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{approval.userEmail}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Registered: {new Date(approval.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              onClick={() => approvalMutation.mutate({ userId: approval.userId, role: approval.role, status: "approved" })}
                              disabled={approvalMutation.isPending}
                              data-testid={`button-approve-full-${approval.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => approvalMutation.mutate({ userId: approval.userId, role: approval.role, status: "rejected" })}
                              disabled={approvalMutation.isPending}
                              data-testid={`button-reject-full-${approval.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                        {approval.businessInfo && (
                          <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm" data-testid={`card-approval-business-${approval.id}`}>
                            <p className="font-medium text-primary mb-2">
                              {approval.businessInfo.name || approval.businessInfo.businessName}
                            </p>
                            {approval.businessInfo.description && (
                              <p className="text-muted-foreground mb-2">{approval.businessInfo.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              {approval.businessInfo.cuisine && (
                                <>
                                  <span className="text-muted-foreground">Cuisine:</span>
                                  <span>{approval.businessInfo.cuisine}</span>
                                </>
                              )}
                              {approval.businessInfo.category && (
                                <>
                                  <span className="text-muted-foreground">Category:</span>
                                  <span className="capitalize">{approval.businessInfo.category}</span>
                                </>
                              )}
                              {approval.businessInfo.city && (
                                <>
                                  <span className="text-muted-foreground">City:</span>
                                  <span>{approval.businessInfo.city}</span>
                                </>
                              )}
                              {approval.businessInfo.phone && (
                                <>
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{approval.businessInfo.phone}</span>
                                </>
                              )}
                              {approval.businessInfo.address && (
                                <>
                                  <span className="text-muted-foreground">Address:</span>
                                  <span>{approval.businessInfo.address}</span>
                                </>
                              )}
                              {approval.businessInfo.email && (
                                <>
                                  <span className="text-muted-foreground">Email:</span>
                                  <span>{approval.businessInfo.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usersData?.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-user-${u.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold" data-testid={`text-user-name-${u.id}`}>
                          {u.firstName} {u.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-user-email-${u.id}`}>
                          {u.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          {u.roles.map((role) => (
                            <Badge key={role} variant="secondary" data-testid={`badge-role-${u.id}-${role}`}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {ALL_ROLES.map((role) => {
                          const hasRole = u.roles.includes(role);
                          return (
                            <Button
                              key={role}
                              variant={hasRole ? "destructive" : "outline"}
                              size="sm"
                              disabled={updateUserRoleMutation.isPending}
                              onClick={() =>
                                updateUserRoleMutation.mutate({
                                  id: u.id,
                                  role,
                                  action: hasRole ? "remove" : "add",
                                })
                              }
                              data-testid={`button-${hasRole ? "remove" : "add"}-role-${role}-${u.id}`}
                            >
                              {hasRole ? (
                                <UserMinus className="h-3 w-3 mr-1" />
                              ) : (
                                <UserPlus className="h-3 w-3 mr-1" />
                              )}
                              {role}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {usersData?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  )}
                </div>
              </CardContent>
            </Card>
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
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-restaurant-${restaurant.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">{restaurant.cuisine} - {restaurant.city}</p>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-restaurant-${restaurant.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{restaurant.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-restaurant-${restaurant.id}`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteRestaurantMutation.mutate(restaurant.id)}
                                data-testid={`button-confirm-delete-restaurant-${restaurant.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {restaurants?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No restaurants found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View all food orders grouped by restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-4 mb-6 p-4 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    Filters
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <Label htmlFor="filter-restaurant" className="text-xs text-muted-foreground mb-1 block">Restaurant</Label>
                    <Select value={orderFilterRestaurant} onValueChange={setOrderFilterRestaurant}>
                      <SelectTrigger data-testid="select-filter-restaurant">
                        <SelectValue placeholder="All restaurants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All restaurants</SelectItem>
                        {(() => {
                          const seen = new Map<string, string>();
                          orders?.forEach(o => {
                            if (!seen.has(o.restaurantId)) {
                              seen.set(o.restaurantId, o.restaurant?.name || "Unknown");
                            }
                          });
                          return Array.from(seen.entries()).map(([id, name]) => (
                            <SelectItem key={id} value={id} data-testid={`option-restaurant-${id}`}>{name}</SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[150px]">
                    <Label htmlFor="filter-date-from" className="text-xs text-muted-foreground mb-1 block">From date</Label>
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={orderFilterDateFrom}
                      onChange={(e) => setOrderFilterDateFrom(e.target.value)}
                      data-testid="input-filter-date-from"
                    />
                  </div>
                  <div className="min-w-[150px]">
                    <Label htmlFor="filter-date-to" className="text-xs text-muted-foreground mb-1 block">To date</Label>
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={orderFilterDateTo}
                      onChange={(e) => setOrderFilterDateTo(e.target.value)}
                      data-testid="input-filter-date-to"
                    />
                  </div>
                  {(orderFilterRestaurant !== "all" || orderFilterDateFrom || orderFilterDateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOrderFilterRestaurant("all");
                        setOrderFilterDateFrom("");
                        setOrderFilterDateTo("");
                      }}
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {(() => {
                  if (!orders || orders.length === 0) {
                    return <p className="text-center text-muted-foreground py-8">No orders found</p>;
                  }

                  let filtered = orders;
                  if (orderFilterRestaurant !== "all") {
                    filtered = filtered.filter(o => o.restaurantId === orderFilterRestaurant);
                  }
                  if (orderFilterDateFrom) {
                    const from = new Date(orderFilterDateFrom);
                    from.setHours(0, 0, 0, 0);
                    filtered = filtered.filter(o => new Date(o.createdAt!) >= from);
                  }
                  if (orderFilterDateTo) {
                    const to = new Date(orderFilterDateTo);
                    to.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(o => new Date(o.createdAt!) <= to);
                  }

                  if (filtered.length === 0) {
                    return <p className="text-center text-muted-foreground py-8">No orders match the selected filters</p>;
                  }

                  const grouped: Record<string, { name: string; orders: typeof filtered }> = {};
                  for (const order of filtered) {
                    const key = order.restaurantId;
                    if (!grouped[key]) {
                      grouped[key] = { name: order.restaurant?.name || "Unknown Restaurant", orders: [] };
                    }
                    grouped[key].orders.push(order);
                  }

                  const totalFiltered = filtered.length;
                  const totalRevenue = filtered.reduce((sum, o) => sum + parseFloat(o.total), 0);

                  return (
                    <div>
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <span data-testid="text-filtered-count">{totalFiltered} order{totalFiltered !== 1 ? "s" : ""}</span>
                        <span data-testid="text-filtered-revenue">Total: ${totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="space-y-6">
                        {Object.entries(grouped).map(([restaurantId, group]) => (
                          <div key={restaurantId} data-testid={`admin-group-restaurant-${restaurantId}`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                <Store className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold" data-testid={`admin-group-name-${restaurantId}`}>{group.name}</h3>
                                <p className="text-xs text-muted-foreground">{group.orders.length} order{group.orders.length !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                            <div className="space-y-2 ml-11">
                              {group.orders.map((order) => (
                                <div
                                  key={order.id}
                                  className="flex items-center justify-between gap-4 p-3 border rounded-md"
                                  data-testid={`row-order-${order.id}`}
                                >
                                  <div>
                                    <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                                    <p className="text-sm text-muted-foreground">
                                      ${order.total} - {new Date(order.createdAt!).toLocaleDateString()}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-provider-${provider.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{provider.businessName}</h3>
                        <p className="text-sm text-muted-foreground">{provider.category} - {provider.city}</p>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-provider-${provider.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{provider.businessName}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-provider-${provider.id}`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProviderMutation.mutate(provider.id)}
                                data-testid={`button-confirm-delete-provider-${provider.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {providers?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No providers found</p>
                  )}
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
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-booking-${booking.id}`}
                    >
                      <div>
                        <p className="font-mono text-sm">{booking.id.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.price ? `$${booking.price}` : "Quote"} - {new Date(booking.createdAt!).toLocaleDateString()}
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
                  {bookingsData?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No bookings found</p>
                  )}
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
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-event-${event.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.category} - {new Date(event.eventDate).toLocaleDateString()}
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-event-${event.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{event.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-event-${event.id}`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteEventMutation.mutate(event.id)}
                                data-testid={`button-confirm-delete-event-${event.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {events?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No events found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yellowpages">
            <Card>
              <CardHeader>
                <CardTitle>Yellow Pages Management</CardTitle>
                <CardDescription>Manage rental listings and classifieds submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {yellowPagesData?.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-yp-${listing.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.category} - {listing.city} {listing.price ? `- $${listing.price}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{listing.contactName} {listing.contactPhone ? `- ${listing.contactPhone}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Approved</span>
                          <Switch
                            checked={listing.isApproved || false}
                            onCheckedChange={(checked) =>
                              updateYellowPageMutation.mutate({ id: listing.id, data: { isApproved: checked } })
                            }
                            data-testid={`switch-yp-approved-${listing.id}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch
                            checked={listing.isActive || false}
                            onCheckedChange={(checked) =>
                              updateYellowPageMutation.mutate({ id: listing.id, data: { isActive: checked } })
                            }
                            data-testid={`switch-yp-active-${listing.id}`}
                          />
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-yp-${listing.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteYellowPageMutation.mutate(listing.id)}
                                data-testid={`button-confirm-delete-yp-${listing.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {(!yellowPagesData || yellowPagesData.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No Yellow Pages listings found</p>
                  )}
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
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-business-${business.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{business.name}</h3>
                        <p className="text-sm text-muted-foreground">{business.category} - {business.city}</p>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-business-${business.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Business</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{business.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-business-${business.id}`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBusinessMutation.mutate(business.id)}
                                data-testid={`button-confirm-delete-business-${business.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {businessesData?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No businesses found</p>
                  )}
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
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                      data-testid={`row-announcement-${announcement.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          {announcement.isPinned && <Badge variant="outline">Pinned</Badge>}
                          <Badge variant="secondary">{announcement.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{announcement.content}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-announcement-${announcement.id}`}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this announcement? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                              data-testid={`button-confirm-delete-announcement-${announcement.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                  {announcementsData?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No announcements found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Food Review Moderation</CardTitle>
                  <CardDescription>Moderate food order reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviewsData?.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                        data-testid={`row-review-${review.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-review-${review.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReviewMutation.mutate(review.id)}
                                data-testid={`button-confirm-delete-review-${review.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                    {reviewsData?.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No food reviews to moderate</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Review Moderation</CardTitle>
                  <CardDescription>Moderate service provider reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {serviceReviewsData?.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                        data-testid={`row-service-review-${review.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-service-review-${review.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Service Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this service review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteServiceReviewMutation.mutate(review.id)}
                                data-testid={`button-confirm-delete-service-review-${review.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                    {serviceReviewsData?.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No service reviews to moderate</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
