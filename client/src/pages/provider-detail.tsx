import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReviewDisplay } from "@/components/review-display";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Star, MapPin, Phone, Mail, Globe, Check, Clock, Calendar as CalendarIcon,
  Languages, Award, MessageSquare, ChevronLeft, CreditCard, DollarSign
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useLanguage } from "@/lib/language-context";
import type { ServiceProvider, Service, ServiceReview } from "@shared/schema";

const PLATFORM_FEE_PERCENT = 0.08;

function BookingDialog({ provider, service }: { provider: ServiceProvider; service?: Service }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const servicePrice = parseFloat(service?.price || "0");
  const platformFee = Math.round(servicePrice * PLATFORM_FEE_PERCENT * 100) / 100;
  const providerBookingFee = parseFloat(provider.bookingFee || "0");
  const totalFees = platformFee + providerBookingFee;
  const totalAmount = servicePrice + totalFees;

  const createBookingCheckout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings/checkout", {
        providerId: provider.id,
        serviceId: service?.id,
        requestedDate: date?.toISOString(),
        requestedTime: time,
        address,
        notes,
      });
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({ title: t("booking.error"), description: error.message || t("booking.checkoutFailed"), variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <Link href="/">
        <Button data-testid="button-login-to-book">{t("booking.loginToBook")}</Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid={`button-book-${service?.id || "provider"}`}>
          {totalAmount > 0 ? `${t("booking.book")} - $${totalAmount.toFixed(2)}` : t("booking.requestBooking")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("booking.book")} {service?.name || provider.businessName}</DialogTitle>
          <DialogDescription>
            {t("booking.selectDateTime")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("booking.date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start" data-testid="button-select-date">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : t("booking.selectDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>{t("booking.time")}</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              data-testid="input-booking-time"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("booking.address")}</Label>
            <Input
              placeholder={t("booking.addressPlaceholder")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="input-booking-address"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("booking.notes")}</Label>
            <Textarea
              placeholder={t("booking.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              data-testid="input-booking-notes"
            />
          </div>

          {totalAmount > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{t("booking.paymentSummary")}</span>
                </div>
                {service && servicePrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{service.name}</span>
                    <span data-testid="text-service-price">${servicePrice.toFixed(2)}</span>
                  </div>
                )}
                {platformFee > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t("booking.platformFee")} (8%)</span>
                    <span data-testid="text-platform-fee">${platformFee.toFixed(2)}</span>
                  </div>
                )}
                {providerBookingFee > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t("booking.bookingFee")}</span>
                    <span data-testid="text-booking-fee">${providerBookingFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>{t("booking.total")}</span>
                  <span data-testid="text-booking-total">${totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={() => createBookingCheckout.mutate()} 
            disabled={!date || createBookingCheckout.isPending || totalAmount <= 0}
            data-testid="button-submit-booking"
          >
            {createBookingCheckout.isPending ? t("booking.processing") : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t("booking.payAndBook")} ${totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceCard({ service, provider }: { service: Service; provider: ServiceProvider }) {
  return (
    <Card data-testid={`service-card-${service.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">{service.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {service.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.duration} min
                </span>
              )}
              <span className="capitalize">{service.priceType}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-lg">${parseFloat(service.price || "0").toFixed(2)}</p>
            {service.priceType === "hourly" && <p className="text-xs text-muted-foreground">/hour</p>}
            <div className="mt-2">
              <BookingDialog provider={provider} service={service} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function ProviderDetailPage() {
  const { id } = useParams();

  const { data: provider, isLoading: providerLoading } = useQuery<ServiceProvider>({
    queryKey: ["/api/services/providers", id],
  });

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services/providers", id, "services"],
  });

  const { data: reviews } = useQuery<ServiceReview[]>({
    queryKey: ["/api/services/providers", id, "reviews"],
  });

  if (providerLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container py-6 max-w-4xl">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Provider not found</p>
          <Link href="/services">
            <Button variant="outline" className="mt-4">Back to Services</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <Link href="/services">
        <Button variant="ghost" className="mb-4" data-testid="button-back-services">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Button>
      </Link>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold">{provider.businessName}</h1>
                {provider.isVerified && (
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">{provider.category}</Badge>
              </div>
              <p className="text-muted-foreground mb-4">{provider.description}</p>
              
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{parseFloat(provider.rating || "0").toFixed(1)}</span>
                  <span className="text-muted-foreground">({provider.reviewCount} reviews)</span>
                </div>
                {provider.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{provider.address}, {provider.city}</span>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{provider.phone}</span>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{provider.email}</span>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a href={`https://${provider.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {provider.website}
                    </a>
                  </div>
                )}
                {provider.languages && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Languages className="h-4 w-4" />
                    <span>{provider.languages}</span>
                  </div>
                )}
                {provider.yearsExperience && provider.yearsExperience > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{provider.yearsExperience} years experience</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-bold">{provider.priceRange}</span>
              <BookingDialog provider={provider} />
              <Button variant="outline" data-testid="button-message-provider">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services" data-testid="tab-services">
            Services ({services?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            Reviews ({reviews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          {servicesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="space-y-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} provider={provider} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No services listed yet</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewDisplay
                  key={review.id}
                  review={review}
                  customerName="Customer"
                  type="service"
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No reviews yet</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
