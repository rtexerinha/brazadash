import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, ChevronLeft, Star, Phone, Mail, MessageSquare } from "lucide-react";
import type { Booking, ServiceProvider, Service } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusDescriptions: Record<string, string> = {
  pending: "Waiting for provider to respond",
  accepted: "Provider accepted - awaiting confirmation",
  declined: "Provider declined this request",
  confirmed: "Booking is confirmed",
  in_progress: "Service is in progress",
  completed: "Service completed",
  cancelled: "Booking was cancelled",
};

function ReviewDialog({ bookingId, providerId }: { bookingId: string; providerId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const createReview = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/services/reviews", {
        bookingId,
        providerId,
        rating,
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId] });
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-leave-review">
          <Star className="mr-2 h-4 w-4" />
          Leave Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>Share your experience with this service provider</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              data-testid="input-review-comment"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => createReview.mutate()} disabled={createReview.isPending} data-testid="button-submit-review">
            {createReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();

  const { data: booking, isLoading } = useQuery<Booking & { provider?: ServiceProvider; service?: Service }>({
    queryKey: ["/api/bookings", id],
  });

  if (isLoading) {
    return (
      <div className="container py-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container py-6 max-w-2xl">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Booking not found</p>
          <Link href="/bookings">
            <Button variant="outline" className="mt-4">Back to Bookings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const date = booking.confirmedDate || booking.requestedDate;
  const time = booking.confirmedTime || booking.requestedTime;

  return (
    <div className="container py-6 max-w-2xl">
      <Link href="/bookings">
        <Button variant="ghost" className="mb-4" data-testid="button-back-bookings">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>{booking.provider?.businessName || "Service Booking"}</CardTitle>
            <Badge className={statusColors[booking.status]}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {statusDescriptions[booking.status]}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {booking.service && (
            <div>
              <h3 className="font-semibold mb-2">Service</h3>
              <div className="bg-muted/50 rounded-md p-4">
                <p className="font-medium">{booking.service.name}</p>
                {booking.service.description && (
                  <p className="text-sm text-muted-foreground mt-1">{booking.service.description}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Booking Details</h3>
            <div className="space-y-2 text-sm">
              {date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              )}
              {time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{time}</span>
                </div>
              )}
              {booking.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.address}</span>
                </div>
              )}
            </div>
          </div>

          {booking.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          )}

          {booking.price && (
            <div>
              <h3 className="font-semibold mb-2">Price</h3>
              <p className="text-2xl font-bold">${parseFloat(booking.price).toFixed(2)}</p>
            </div>
          )}

          {booking.provider && (
            <div>
              <h3 className="font-semibold mb-2">Provider Contact</h3>
              <div className="space-y-2 text-sm">
                {booking.provider.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.provider.phone}</span>
                  </div>
                )}
                {booking.provider.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.provider.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {booking.status === "completed" && booking.provider && (
              <ReviewDialog bookingId={booking.id} providerId={booking.provider.id} />
            )}
            {booking.provider && (
              <Link href={`/services/provider/${booking.provider.id}`}>
                <Button variant="outline" data-testid="button-view-provider">
                  View Provider
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
