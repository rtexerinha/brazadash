import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import type { Booking } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function BookingCard({ booking }: { booking: Booking & { provider?: { businessName: string } } }) {
  const date = booking.confirmedDate || booking.requestedDate;
  const time = booking.confirmedTime || booking.requestedTime;

  return (
    <Link href={`/bookings/${booking.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`booking-card-${booking.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold">{booking.provider?.businessName || "Service Provider"}</h3>
                <Badge className={statusColors[booking.status] || ""}>
                  {booking.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(date).toLocaleDateString()}</span>
                    {time && (
                      <>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{time}</span>
                      </>
                    )}
                  </div>
                )}
                {booking.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{booking.address}</span>
                  </div>
                )}
              </div>
              {booking.price && (
                <p className="font-semibold mt-2">${parseFloat(booking.price).toFixed(2)}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function BookingsPage() {
  const { data: bookings, isLoading } = useQuery<(Booking & { provider?: { businessName: string } })[]>({
    queryKey: ["/api/bookings"],
  });

  const activeBookings = bookings?.filter(b => 
    !["completed", "cancelled", "declined"].includes(b.status)
  ) || [];
  
  const pastBookings = bookings?.filter(b => 
    ["completed", "cancelled", "declined"].includes(b.status)
  ) || [];

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Manage your service bookings</p>
        </div>
        <Link href="/services">
          <Button data-testid="button-find-services">Find Services</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-8">
          {activeBookings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Bookings</h2>
              <div className="space-y-4">
                {activeBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Past Bookings</h2>
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">You haven't made any bookings yet</p>
          <Link href="/services">
            <Button>Browse Services</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
