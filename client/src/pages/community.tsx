import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event, Announcement } from "@shared/schema";
import { 
  Calendar, MapPin, Clock, ArrowRight, Megaphone, 
  PartyPopper, Music, Users2, Dumbbell, ExternalLink,
  Building2, Bell, Tag, AlertCircle, Newspaper
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  festival: PartyPopper,
  concert: Music,
  meetup: Users2,
  sports: Dumbbell,
};

const announcementIcons: Record<string, any> = {
  news: Newspaper,
  promo: Tag,
  update: Bell,
  alert: AlertCircle,
};

const announcementColors: Record<string, string> = {
  news: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  promo: "bg-green-500/10 text-green-700 dark:text-green-400",
  update: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  alert: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function formatEventDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function CommunityPage() {
  const { data: featuredEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/community/events/featured"],
  });

  const { data: upcomingEvents } = useQuery<Event[]>({
    queryKey: ["/api/community/events/upcoming"],
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/community/announcements"],
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Brazilian Community Hub</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with the Brazilian community in California. Discover events, 
            find local businesses, and stay updated with community news.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/events">
            <Card className="h-full hover-elevate cursor-pointer border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Events</CardTitle>
                    <p className="text-sm text-muted-foreground">Festivals, concerts, meetups & more</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Discover Brazilian festivals, samba nights, jiu-jitsu tournaments, 
                  and community gatherings across California.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="gap-2" data-testid="link-browse-events">
                  Browse Events <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>

          <Link href="/businesses">
            <Card className="h-full hover-elevate cursor-pointer border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Business Directory</CardTitle>
                    <p className="text-sm text-muted-foreground">Brazilian-owned businesses</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find and support Brazilian-owned restaurants, stores, salons, 
                  and professional services near you.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="gap-2" data-testid="link-browse-businesses">
                  Browse Directory <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        </div>

        {announcements && announcements.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Megaphone className="h-6 w-6" />
                Announcements
              </h2>
            </div>
            <div className="space-y-4">
              {announcementsLoading ? (
                [1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                announcements.map((announcement) => {
                  const Icon = announcementIcons[announcement.type] || Newspaper;
                  return (
                    <Card 
                      key={announcement.id} 
                      className={announcement.isPinned ? "border-2 border-primary/30" : ""}
                      data-testid={`card-announcement-${announcement.id}`}
                    >
                      <CardHeader className="flex flex-row items-start gap-4">
                        <div className={`p-2 rounded-lg ${announcementColors[announcement.type]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {announcement.isPinned && (
                              <Badge variant="outline" className="text-xs">Pinned</Badge>
                            )}
                            <Badge className={announcementColors[announcement.type]}>
                              {announcement.type}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{announcement.content}</p>
                        {announcement.linkUrl && (
                          <Link href={announcement.linkUrl}>
                            <Button variant="ghost" size="sm" className="mt-2 gap-1 -ml-2">
                              {announcement.linkText || "Learn More"}
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        )}

        {((featuredEvents && featuredEvents.length > 0) || (upcomingEvents && upcomingEvents.length > 0)) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Upcoming Events</h2>
              <Link href="/events">
                <Button variant="outline" data-testid="link-view-all-events">View All</Button>
              </Link>
            </div>
            {eventsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(upcomingEvents || []).slice(0, 6).map((event) => {
                  const Icon = categoryIcons[event.category] || Calendar;
                  return (
                    <Card key={event.id} className="hover-elevate">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            <Icon className="h-3 w-3 mr-1" />
                            {event.category}
                          </Badge>
                          {event.isFree && <Badge variant="outline">Free</Badge>}
                        </div>
                        <CardTitle className="text-base">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatEventDate(event.eventDate)}</span>
                        </div>
                        {event.startTime && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{event.startTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.venue}, {event.city}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
