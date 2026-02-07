import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language-context";
import type { Event } from "@shared/schema";
import { 
  Calendar, MapPin, Clock, Users, Ticket, ExternalLink, Plus, ImagePlus, X,
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
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    category: "meetup",
    eventDate: "",
    startTime: "",
    endTime: "",
    venue: "",
    city: "",
    isFree: true,
    ticketPrice: "",
    ticketUrl: "",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setNewEvent((prev) => ({ ...prev, imageUrl: data.url }));
      toast({ title: t("events.imageUploaded"), description: t("events.imageUploadedDesc") });
    } catch {
      toast({ title: t("events.submitEventError"), description: t("events.imageUploadError"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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

  const submitEventMutation = useMutation({
    mutationFn: async (data: typeof newEvent) => {
      const res = await apiRequest("POST", "/api/community/events", {
        ...data,
        eventDate: new Date(data.eventDate).toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("events.submitEventSuccess"), description: t("events.submitEventSuccessDesc") });
      setShowSubmitDialog(false);
      setNewEvent({
        title: "", description: "", category: "meetup", eventDate: "",
        startTime: "", endTime: "", venue: "", city: "",
        isFree: true, ticketPrice: "", ticketUrl: "", imageUrl: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community/events"] });
    },
    onError: () => {
      toast({ title: t("events.submitEventError"), description: t("events.submitEventErrorDesc"), variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-events-title">{t("community.events")}</h1>
            <p className="text-muted-foreground">
              {t("community.noEventsDesc").replace("!", " in California")}
            </p>
          </div>
          {user && (
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-event">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("events.addEvent")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("events.newEvent")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t("events.eventTitle")}</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder={t("events.eventTitlePlaceholder")}
                      data-testid="input-event-title"
                    />
                  </div>
                  <div>
                    <Label>{t("events.eventCategory")}</Label>
                    <Select
                      value={newEvent.category}
                      onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                    >
                      <SelectTrigger data-testid="select-event-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("events.eventDescription")}</Label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder={t("events.eventDescriptionPlaceholder")}
                      data-testid="input-event-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("events.eventDate")}</Label>
                      <Input
                        type="date"
                        value={newEvent.eventDate}
                        onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                        data-testid="input-event-date"
                      />
                    </div>
                    <div>
                      <Label>{t("events.eventCity")}</Label>
                      <Input
                        value={newEvent.city}
                        onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                        placeholder="Los Angeles"
                        data-testid="input-event-city"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("events.startTime")}</Label>
                      <Input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        data-testid="input-event-start-time"
                      />
                    </div>
                    <div>
                      <Label>{t("events.endTime")}</Label>
                      <Input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        data-testid="input-event-end-time"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("events.venue")}</Label>
                    <Input
                      value={newEvent.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                      placeholder={t("events.venuePlaceholder")}
                      data-testid="input-event-venue"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newEvent.isFree}
                      onCheckedChange={(checked) => setNewEvent({ ...newEvent, isFree: checked })}
                      data-testid="switch-event-free"
                    />
                    <Label>{t("events.isFree")}</Label>
                  </div>
                  {!newEvent.isFree && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("events.ticketPrice")}</Label>
                        <Input
                          value={newEvent.ticketPrice}
                          onChange={(e) => setNewEvent({ ...newEvent, ticketPrice: e.target.value })}
                          placeholder="$25"
                          data-testid="input-event-ticket-price"
                        />
                      </div>
                      <div>
                        <Label>{t("events.ticketUrl")}</Label>
                        <Input
                          value={newEvent.ticketUrl}
                          onChange={(e) => setNewEvent({ ...newEvent, ticketUrl: e.target.value })}
                          placeholder="https://..."
                          data-testid="input-event-ticket-url"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>{t("events.eventImage")}</Label>
                    {newEvent.imageUrl ? (
                      <div className="relative mt-1">
                        <img
                          src={newEvent.imageUrl}
                          alt="Event"
                          className="w-full h-40 object-cover rounded-md"
                          data-testid="img-event-preview"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-background/80"
                          onClick={() => setNewEvent({ ...newEvent, imageUrl: "" })}
                          data-testid="button-remove-event-image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate mt-1"
                        data-testid="label-upload-event-image"
                      >
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading ? t("events.uploadingImage") : t("events.uploadImage")}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          data-testid="input-event-image"
                        />
                      </label>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => submitEventMutation.mutate(newEvent)}
                    disabled={!newEvent.title || !newEvent.eventDate || !newEvent.category || submitEventMutation.isPending}
                    data-testid="button-submit-new-event"
                  >
                    {submitEventMutation.isPending ? t("events.submittingEvent") : t("events.submitEvent")}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("events.approvalNotice")}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {featuredEvents && featuredEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t("community.featuredEvents")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {featuredEvents.map((event) => {
                const Icon = categoryIcons[event.category] || CalendarDays;
                return (
                  <Card key={event.id} className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={categoryColors[event.category]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {event.category}
                          </Badge>
                          {event.isFree && <Badge variant="secondary">{t("community.free")}</Badge>}
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
                        {t("community.rsvp")}
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
            {t("yp.all")}
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
                        {event.isFree && <Badge variant="secondary">{t("community.free")}</Badge>}
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
                      {t("community.rsvp")}
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
            <h3 className="text-lg font-semibold mb-2">{t("community.noEvents")}</h3>
            <p className="text-muted-foreground">
              {selectedCategory
                ? t("community.noEventsDesc")
                : t("community.noEventsDesc")}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
