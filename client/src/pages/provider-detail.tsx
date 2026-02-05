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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Star, MapPin, Phone, Mail, Globe, Check, Clock, Calendar as CalendarIcon,
  Languages, Award, MessageSquare, ChevronLeft
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { ServiceProvider, Service, ServiceReview } from "@shared/schema";

function BookingDialog({ provider, service }: { provider: ServiceProvider; service?: Service }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const createBooking = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/bookings", {
        providerId: provider.id,
        serviceId: service?.id,
        requestedDate: date?.toISOString(),
        requestedTime: time,
        address,
        notes,
        price: service?.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking request sent!", description: "The provider will respond soon." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create booking.", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <Link href="/">
        <Button data-testid="button-login-to-book">Login to Book</Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid={`button-book-${service?.id || "provider"}`}>
          {service ? `Book - $${parseFloat(service.price || "0").toFixed(2)}` : "Request Booking"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {service?.name || provider.businessName}</DialogTitle>
          <DialogDescription>
            Select your preferred date and time for the service
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start" data-testid="button-select-date">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
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
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              data-testid="input-booking-time"
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              placeholder="Service location address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="input-booking-address"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any special requests or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              data-testid="input-booking-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => createBooking.mutate()} 
            disabled={!date || createBooking.isPending}
            data-testid="button-submit-booking"
          >
            {createBooking.isPending ? "Sending..." : "Send Request"}
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

function ReviewCard({ review }: { review: ServiceReview }) {
  return (
    <Card data-testid={`review-${review.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
          </span>
        </div>
        {review.comment && <p className="text-sm">{review.comment}</p>}
        {(review.professionalismRating || review.communicationRating || review.valueRating) && (
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            {review.professionalismRating && (
              <span>Professionalism: {review.professionalismRating}/5</span>
            )}
            {review.communicationRating && (
              <span>Communication: {review.communicationRating}/5</span>
            )}
            {review.valueRating && (
              <span>Value: {review.valueRating}/5</span>
            )}
          </div>
        )}
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
                <ReviewCard key={review.id} review={review} />
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
