import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Star, Clock, MapPin, ChevronRight, Utensils, Quote,
  Sparkles, Home, Scissors, Scale, Dumbbell, Car, GraduationCap,
  Hammer, Camera, Languages, Users, Calendar, Building2, Megaphone
} from "lucide-react";
import type { Restaurant, ServiceProvider, Event, Business, Announcement, Review, ServiceReview } from "@shared/schema";

const serviceCategories = [
  { id: "cleaning", name: "Limpeza", nameEn: "Cleaning", icon: Sparkles, color: "bg-blue-500" },
  { id: "beauty", name: "Beleza", nameEn: "Beauty", icon: Scissors, color: "bg-pink-500" },
  { id: "legal", name: "Legal", nameEn: "Legal", icon: Scale, color: "bg-purple-500" },
  { id: "fitness", name: "Fitness", nameEn: "Fitness", icon: Dumbbell, color: "bg-orange-500" },
  { id: "auto", name: "Auto", nameEn: "Auto", icon: Car, color: "bg-red-500" },
  { id: "construction", name: "Construcao", nameEn: "Construction", icon: Hammer, color: "bg-amber-600" },
];

const testimonials = [
  {
    id: 1,
    name: "Maria Silva",
    location: "San Francisco, CA",
    avatar: "",
    rating: 5,
    comment: "Finalmente encontrei comida brasileira autentica aqui na California! A picanha do Sabor do Brasil e igual a do Brasil. Recomendo muito!",
    commentEn: "Finally found authentic Brazilian food here in California! The picanha from Sabor do Brasil is just like in Brazil. Highly recommend!",
    service: "Food Order"
  },
  {
    id: 2,
    name: "Carlos Santos",
    location: "Los Angeles, CA",
    avatar: "",
    rating: 5,
    comment: "Usei o servico de limpeza e foi excelente! Profissional, pontual e fala portugues. Muito mais facil de se comunicar.",
    commentEn: "Used the cleaning service and it was excellent! Professional, on-time, and speaks Portuguese. Much easier to communicate.",
    service: "Cleaning Service"
  },
  {
    id: 3,
    name: "Ana Oliveira",
    location: "San Diego, CA",
    avatar: "",
    rating: 5,
    comment: "O app facilitou muito minha vida! Agora consigo achar restaurantes e servicos brasileiros perto de mim facilmente.",
    commentEn: "The app made my life so much easier! Now I can easily find Brazilian restaurants and services near me.",
    service: "Platform"
  },
  {
    id: 4,
    name: "Pedro Costa",
    location: "San Jose, CA",
    avatar: "",
    rating: 5,
    comment: "Contratei um personal trainer brasileiro pelo app. Ele entende minha cultura e me ajuda a manter a forma mesmo longe de casa.",
    commentEn: "Hired a Brazilian personal trainer through the app. He understands my culture and helps me stay fit even away from home.",
    service: "Fitness Service"
  }
];

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-restaurant-${restaurant.id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Utensils className="h-12 w-12 text-primary/50" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-restaurant-name-${restaurant.id}`}>
              {restaurant.name}
            </h3>
            {restaurant.isOpen ? (
              <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Open
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">Closed</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {restaurant.description || restaurant.cuisine}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{parseFloat(restaurant.rating || "0").toFixed(1)}</span>
              <span>({restaurant.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{restaurant.deliveryTime}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{restaurant.city}</span>
            <span className="ml-auto font-medium text-foreground">${parseFloat(restaurant.deliveryFee || "0").toFixed(2)} delivery</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RestaurantSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function ServiceCategoryCard({ category }: { category: typeof serviceCategories[0] }) {
  const Icon = category.icon;
  return (
    <Link href={`/services?category=${category.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-service-${category.id}`}>
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full ${category.color} flex items-center justify-center mb-3`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-semibold">{category.name}</h3>
          <p className="text-sm text-muted-foreground">{category.nameEn}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  const initials = testimonial.name.split(" ").map(n => n[0]).join("");
  
  return (
    <Card className="h-full" data-testid={`card-testimonial-${testimonial.id}`}>
      <CardContent className="p-6">
        <Quote className="h-8 w-8 text-primary/20 mb-4" />
        <p className="text-sm mb-2 italic">"{testimonial.comment}"</p>
        <p className="text-xs text-muted-foreground mb-4">"{testimonial.commentEn}"</p>
        
        <div className="flex items-center gap-3 pt-4 border-t">
          <Avatar className="h-10 w-10">
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{testimonial.name}</p>
            <p className="text-xs text-muted-foreground">{testimonial.location}</p>
          </div>
          <div className="flex">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
        <Badge variant="secondary" className="mt-3 text-xs">{testimonial.service}</Badge>
      </CardContent>
    </Card>
  );
}

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  return (
    <Link href={`/services/provider/${provider.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-provider-${provider.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={provider.imageUrl || ""} alt={provider.businessName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {provider.businessName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1">{provider.businessName}</h3>
              <Badge variant="outline" className="mt-1 text-xs capitalize">{provider.category}</Badge>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{parseFloat(provider.rating || "0").toFixed(1)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{provider.city}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.eventDate);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();
  
  return (
    <Link href={`/events?id=${event.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-event-${event.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[60px]">
              <span className="text-xs font-medium text-primary uppercase">{month}</span>
              <span className="text-2xl font-bold text-primary">{day}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1">{event.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{event.description}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{event.venue || event.city || "TBA"}</span>
              </div>
              <Badge variant="secondary" className="mt-2 text-xs capitalize">{event.category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/businesses?id=${business.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-business-${business.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold line-clamp-1">{business.name}</h3>
                {business.isVerified && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{business.description}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{business.city}, {business.state}</span>
              </div>
              <Badge variant="outline" className="mt-2 text-xs capitalize">{business.category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const typeColors = {
    news: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    promo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    update: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    alert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  
  return (
    <Card className="overflow-hidden" data-testid={`card-announcement-${announcement.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold line-clamp-1">{announcement.title}</h4>
              <Badge className={`text-xs ${typeColors[announcement.type as keyof typeof typeColors] || typeColors.news}`}>
                {announcement.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review, type }: { review: Review | ServiceReview, type: 'food' | 'service' }) {
  const photos = review.photoUrls || [];
  
  return (
    <Card className="h-full" data-testid={`card-review-${review.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {(review as any).userName?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{(review as any).userName || "Customer"}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{type === 'food' ? 'Food' : 'Service'}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
        {photos.length > 0 && (
          <div className="flex gap-1 mt-3">
            {photos.slice(0, 3).map((photo: string, i: number) => (
              <div key={i} className="w-12 h-12 rounded overflow-hidden">
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {photos.length > 3 && (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{photos.length - 3}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: restaurants, isLoading: restaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const { data: providers, isLoading: providersLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/services/providers"],
  });

  const { data: upcomingEvents } = useQuery<Event[]>({
    queryKey: ["/api/community/events/upcoming"],
  });

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/community/businesses"],
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/community/announcements"],
  });

  const { data: recentReviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews/recent"],
  });

  const { data: recentServiceReviews } = useQuery<ServiceReview[]>({
    queryKey: ["/api/services/reviews/recent"],
  });

  const featuredRestaurants = restaurants?.slice(0, 6) || [];
  const featuredProviders = providers?.slice(0, 4) || [];
  const featuredEvents = upcomingEvents?.slice(0, 3) || [];
  const featuredBusinesses = businesses?.slice(0, 4) || [];
  const activeAnnouncements = announcements?.slice(0, 2) || [];
  
  // Combine and sort reviews
  const allReviews = [
    ...(recentReviews?.map(r => ({ ...r, type: 'food' as const })) || []),
    ...(recentServiceReviews?.map(r => ({ ...r, type: 'service' as const })) || [])
  ].slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-yellow-500/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Users className="h-3 w-3 mr-1" />
                Comunidade Brasileira na California
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-welcome">
              Ola{user?.firstName ? `, ${user.firstName}` : ""}! 
              <span className="text-primary"> Bem-vindo ao BrazaDash</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Sua conexao com a comunidade brasileira na California. Descubra restaurantes autenticos, 
              encontre servicos de confianca, e conecte-se com a nossa comunidade.
            </p>
            <p className="text-md text-muted-foreground/80 mb-8">
              Your connection to the Brazilian community in California. Discover authentic restaurants, 
              find trusted services, and connect with our community.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild data-testid="button-order-food">
                <Link href="/restaurants">
                  <Utensils className="mr-2 h-5 w-5" />
                  Order Food
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-find-services">
                <Link href="/services">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Find Services
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild data-testid="button-community">
                <Link href="/community">
                  <Users className="mr-2 h-5 w-5" />
                  Community
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Servicos Populares</h2>
              <p className="text-muted-foreground">Popular services from our Brazilian community</p>
            </div>
            <Button variant="ghost" asChild data-testid="button-view-all-services">
              <Link href="/services">
                Ver Todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {serviceCategories.map((category) => (
              <ServiceCategoryCard key={category.id} category={category} />
            ))}
          </div>

          {/* Featured Providers */}
          {featuredProviders.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Provedores em Destaque / Featured Providers</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Restaurantes em Destaque</h2>
              <p className="text-muted-foreground">Discover the best Brazilian food in your area</p>
            </div>
            <Button variant="ghost" asChild data-testid="button-view-all">
              <Link href="/restaurants">
                Ver Todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {restaurantsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <RestaurantSkeleton key={i} />
              ))}
            </div>
          ) : featuredRestaurants.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Utensils className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No restaurants yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to add your restaurant to BrazaDash!
              </p>
              <Button asChild>
                <Link href="/vendor">Become a Vendor</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Depoimentos da Comunidade
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">O Que Nossa Comunidade Diz</h2>
            <p className="text-muted-foreground">What our community says about BrazaDash</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Community Hub Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30">
                <Users className="h-3 w-3 mr-1" />
                Comunidade Brasileira
              </Badge>
              <h2 className="text-2xl font-bold mb-1">Community Hub</h2>
              <p className="text-muted-foreground">Connect with the Brazilian community in California</p>
            </div>
            <Button variant="ghost" asChild data-testid="button-view-community">
              <Link href="/community">
                Explorar
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Announcements */}
          {activeAnnouncements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-yellow-600" />
                Anuncios / Announcements
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {activeAnnouncements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Proximos Eventos / Upcoming Events
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/events">
                    Ver Todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {featuredEvents.length > 0 ? (
                <div className="space-y-4">
                  {featuredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum evento proximo / No upcoming events</p>
                </Card>
              )}
            </div>

            {/* Featured Businesses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Negocios em Destaque / Featured Businesses
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/businesses">
                    Ver Todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {featuredBusinesses.length > 0 ? (
                <div className="space-y-4">
                  {featuredBusinesses.slice(0, 3).map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum negocio ainda / No businesses yet</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      {allReviews.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Avaliacoes Recentes
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Recent Reviews</h2>
              <p className="text-muted-foreground">See what customers are saying about our vendors</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allReviews.map((review) => (
                <ReviewCard key={`${review.type}-${review.id}`} review={review} type={review.type} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Categorias de Comida / Food Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Churrasco", image: "/images/food-picanha.png" },
              { name: "Acai", image: "/images/food-acai.png" },
              { name: "Salgados", image: "/images/food-coxinha.png" },
              { name: "Pao de Queijo", image: "/images/food-paodequeijo.png" },
            ].map((category) => (
              <Link key={category.name} href={`/restaurants?cuisine=${category.name}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-category-${category.name.toLowerCase()}`}>
                  <div className="aspect-square relative">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-white font-semibold text-lg">{category.name}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Faca Parte da Nossa Comunidade
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join our growing Brazilian community in California. Whether you're a restaurant owner, 
            service provider, or just looking for authentic Brazilian experiences.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/vendor">
                <Utensils className="mr-2 h-5 w-5" />
                Register Restaurant
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/provider-portal">
                <Sparkles className="mr-2 h-5 w-5" />
                Become a Provider
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
