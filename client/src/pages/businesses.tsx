import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Business } from "@shared/schema";
import { 
  Search, MapPin, Phone, Globe, Mail, CheckCircle, Building2,
  Utensils, ShoppingCart, Sparkles, Dumbbell, Car, Scale, Home, 
  GraduationCap, HeartPulse, ShoppingBag, Briefcase
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  restaurant: Utensils,
  grocery: ShoppingCart,
  beauty: Sparkles,
  fitness: Dumbbell,
  auto: Car,
  legal: Scale,
  "real-estate": Home,
  education: GraduationCap,
  healthcare: HeartPulse,
  retail: ShoppingBag,
  professional: Briefcase,
  other: Building2,
};

export default function BusinessesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories } = useQuery<{ id: string; name: string; icon: string }[]>({
    queryKey: ["/api/community/business-categories"],
  });

  const { data: businesses, isLoading } = useQuery<Business[]>({
    queryKey: ["/api/community/businesses", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);
      const url = `/api/community/businesses${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      return res.json();
    },
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold">Business Directory</h1>
          <p className="text-muted-foreground">
            Discover Brazilian-owned businesses in California
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-businesses"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
            data-testid="button-business-category-all"
          >
            All
          </Button>
          {categories?.map((cat) => {
            const Icon = categoryIcons[cat.id] || Building2;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
                data-testid={`button-business-category-${cat.id}`}
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
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => {
              const Icon = categoryIcons[business.category] || Building2;
              return (
                <Card key={business.id} className="hover-elevate" data-testid={`card-business-${business.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">
                          <Icon className="h-3 w-3 mr-1" />
                          {business.category}
                        </Badge>
                        {business.isVerified && (
                          <Badge className="bg-primary/10 text-primary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base" data-testid={`text-business-name-${business.id}`}>
                        {business.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {business.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                    )}
                    <div className="flex flex-col gap-2 text-sm">
                      {business.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">
                            {business.address}, {business.city}, {business.state} {business.zipCode}
                          </span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                            {business.phone}
                          </a>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${business.email}`} className="text-primary hover:underline truncate">
                            {business.email}
                          </a>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={business.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline truncate"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                    {business.isBrazilianOwned && (
                      <div className="pt-2">
                        <Badge variant="outline" className="text-xs">
                          Brazilian-owned
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "No businesses match your search. Try different keywords."
                : selectedCategory
                ? "No businesses in this category yet."
                : "No businesses listed yet. Check back soon!"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
