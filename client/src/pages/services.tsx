import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Star, MapPin, Check, Sparkles, Scissors, Car, Scale, 
  Plane, Dumbbell, GraduationCap, Hammer, Camera, Languages, Grid3X3
} from "lucide-react";
import type { ServiceProvider, ServiceCategory } from "@shared/schema";

const categoryInfo: Record<ServiceCategory, { label: string; icon: typeof Sparkles; color: string }> = {
  cleaning: { label: "Cleaning", icon: Sparkles, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  beauty: { label: "Beauty", icon: Scissors, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  auto: { label: "Auto", icon: Car, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  legal: { label: "Legal", icon: Scale, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  immigration: { label: "Immigration", icon: Plane, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  fitness: { label: "Fitness", icon: Dumbbell, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  education: { label: "Education", icon: GraduationCap, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  construction: { label: "Construction", icon: Hammer, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  photography: { label: "Photography", icon: Camera, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  translation: { label: "Translation", icon: Languages, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  other: { label: "Other", icon: Grid3X3, color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
};

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  const category = categoryInfo[provider.category as ServiceCategory] || categoryInfo.other;
  const Icon = category.icon;

  return (
    <Link href={`/services/provider/${provider.id}`}>
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`provider-card-${provider.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-lg flex items-center justify-center shrink-0 ${category.color}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{provider.businessName}</h3>
                {provider.isVerified && (
                  <Badge variant="secondary" className="shrink-0">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {provider.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{parseFloat(provider.rating || "0").toFixed(1)}</span>
                  <span className="text-muted-foreground">({provider.reviewCount})</span>
                </div>
                {provider.city && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{provider.city}</span>
                  </div>
                )}
                <span className="text-muted-foreground">{provider.priceRange}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CategoryButton({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: ServiceCategory | "all"; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const info = category === "all" 
    ? { label: "All", icon: Grid3X3, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" }
    : categoryInfo[category];
  const Icon = info.icon;

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="flex flex-col h-auto py-3 px-4 gap-2"
      onClick={onClick}
      data-testid={`category-${category}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs">{info.label}</span>
    </Button>
  );
}

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">("all");

  const { data: providers, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/services/providers", selectedCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (search) params.append("search", search);
      const res = await fetch(`/api/services/providers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
  });

  const categories: (ServiceCategory | "all")[] = [
    "all", "cleaning", "beauty", "auto", "legal", "immigration", 
    "fitness", "education", "construction", "photography", "translation"
  ];

  return (
    <div className="container py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Find Brazilian Services</h1>
        <p className="text-muted-foreground">
          Connect with trusted Brazilian service providers in California
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services, providers, or locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-services"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
        {categories.map((cat) => (
          <CategoryButton
            key={cat}
            category={cat}
            isSelected={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : providers && providers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {search 
              ? "No providers found matching your search." 
              : "No service providers available in this category yet."}
          </p>
        </Card>
      )}
    </div>
  );
}
