import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { 
  Calendar, MapPin, Clock, Users, Ticket, ExternalLink,
  PartyPopper, Music, Users2, Dumbbell, Landmark, Utensils, GraduationCap, CalendarDays
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  festival: PartyPopper,
  concert: Music,
  meetup: Users2,
  sports: Dumbbell,
  cultural: Landmark,
  food: Utensils,
  workshop: GraduationCap,
  other: CalendarDays,
};

const categoryColors: Record<string, string> = {
  festival: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  concert: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  meetup: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  sports: "bg-green-500/10 text-green-700 dark:text-green-400",
  cultural: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  food: "bg-red-500/10 text-red-700 dark:text-red-400",
  workshop: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

function formatEventDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories } = useQuery<{ id: string; name: string; icon: string }[]>({
    queryKey: ["/api/community/event-categories"],
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/community/events", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/community/events?category=${selectedCategory}`
        : "/api/community/events";
      const res = await fetch(url);
      return res.json();
    },
  });

  const { data: featuredEvents } = useQuery<Event[]>({
    queryKey: ["/api/community/events/featured"],
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const res = await apiRequest("POST", `/api/community/events/${eventId}/rsvp`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "RSVP Updated", description: "Your RSVP has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/community/events", selectedCategory] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/events/featured"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update RSVP. Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold">Community Events</h1>
          <p className="text-muted-foreground">
            Discover Brazilian festivals, concerts, meetups, and more in California
          </p>
        </div>

        {featuredEvents && featuredEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Featured Events</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {featuredEvents.map((event) => {
                const Icon = categoryIcons[event.category] || CalendarDays;
                return (
                  <Card key={event.id} className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={categoryColors[event.category]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {event.category}
                          </Badge>
                          {event.isFree && <Badge variant="secondary">Free</Badge>}
                        </div>
                        <CardTitle className="text-lg" data-testid={`text-event-title-${event.id}`}>
                          {event.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatEventDate(event.eventDate)}</span>
                        </div>
                        {event.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{event.startTime}{event.endTime && ` - ${event.endTime}`}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.venue}, {event.city}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "going" })}
                        disabled={rsvpMutation.isPending}
                        data-testid={`button-rsvp-${event.id}`}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        I'm Going
                      </Button>
                      {event.ticketUrl && (
                        <Button variant="outline" asChild>
                          <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                            <Ticket className="h-4 w-4 mr-2" />
                            Get Tickets
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
            data-testid="button-category-all"
          >
            All Events
          </Button>
          {categories?.map((cat) => {
            const Icon = categoryIcons[cat.id] || CalendarDays;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
                data-testid={`button-category-${cat.id}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {cat.name}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const Icon = categoryIcons[event.category] || CalendarDays;
              return (
                <Card key={event.id} className="hover-elevate" data-testid={`card-event-${event.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={categoryColors[event.category]}>
                          <Icon className="h-3 w-3 mr-1" />
                          {event.category}
                        </Badge>
                        {event.isFree && <Badge variant="secondary">Free</Badge>}
                      </div>
                      <CardTitle className="text-base">{event.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatEventDate(event.eventDate)}</span>
                      </div>
                      {event.startTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{event.startTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{event.venue}, {event.city}</span>
                      </div>
                      {event.ticketPrice && (
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          <span>{event.ticketPrice}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "going" })}
                      disabled={rsvpMutation.isPending}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      RSVP
                    </Button>
                    {event.ticketUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">
              {selectedCategory
                ? "No events in this category. Check back later or try a different category."
                : "No upcoming events at the moment. Check back soon!"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
