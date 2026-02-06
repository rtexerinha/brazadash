import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Star, MapPin, Check, Sparkles, Scissors, Car, Scale, 
  Plane, Dumbbell, GraduationCap, Hammer, Camera, Languages, Grid3X3,
  ArrowRight, Shield
} from "lucide-react";
import type { ServiceProvider, ServiceCategory } from "@shared/schema";

const categoryInfo: Record<ServiceCategory, { label: string; labelPt: string; icon: typeof Sparkles; color: string; bgColor: string }> = {
  cleaning: { label: "Cleaning", labelPt: "Limpeza", icon: Sparkles, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  beauty: { label: "Beauty", labelPt: "Beleza", icon: Scissors, color: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  auto: { label: "Auto", labelPt: "Auto", icon: Car, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  legal: { label: "Legal", labelPt: "Legal", icon: Scale, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  immigration: { label: "Immigration", labelPt: "Imigracao", icon: Plane, color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  fitness: { label: "Fitness", labelPt: "Fitness", icon: Dumbbell, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  education: { label: "Education", labelPt: "Educacao", icon: GraduationCap, color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  construction: { label: "Construction", labelPt: "Construcao", icon: Hammer, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  photography: { label: "Photography", labelPt: "Fotografia", icon: Camera, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  translation: { label: "Translation", labelPt: "Traducao", icon: Languages, color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  other: { label: "Other", labelPt: "Outro", icon: Grid3X3, color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
};

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  const { t } = useLanguage();
  const category = categoryInfo[provider.category as ServiceCategory] || categoryInfo.other;
  const Icon = category.icon;
  const initials = provider.businessName.substring(0, 2).toUpperCase();
  const rating = parseFloat(provider.rating || "0").toFixed(1);

  return (
    <Link href={`/services/provider/${provider.id}`}>
      <Card className="hover-elevate cursor-pointer h-full group" data-testid={`provider-card-${provider.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-lg shrink-0">
              <AvatarImage src={provider.imageUrl || ""} alt={provider.businessName} className="rounded-lg" />
              <AvatarFallback className={`rounded-lg ${category.bgColor} ${category.color} font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{provider.businessName}</h3>
                {provider.isVerified && (
                  <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    {t("services.verified")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
                {provider.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{rating}</span>
                  <span className="text-muted-foreground">({provider.reviewCount})</span>
                </div>
                {provider.city && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{provider.city}</span>
                  </div>
                )}
                {provider.priceRange && (
                  <span className="font-medium text-muted-foreground">{provider.priceRange}</span>
                )}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProviderSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServicesPage() {
  const { t, language } = useLanguage();
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

  const resultCount = providers?.length || 0;

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-yellow-500/10 py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-services-title">
            {t("services.title")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("services.subtitle")}
          </p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("services.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-background"
              data-testid="input-search-services"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-5xl py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const info = cat === "all" 
              ? { label: "All", labelPt: "Todos", icon: Grid3X3, color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800" }
              : categoryInfo[cat];
            const Icon = info.icon;

            return (
              <Button
                key={cat}
                variant={isSelected ? "default" : "outline"}
                className={`flex items-center gap-2 shrink-0 ${isSelected ? "" : "bg-background"}`}
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-${cat}`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat === "all" ? t("services.allCategories") : (language === "pt" ? info.labelPt : info.label)}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground" data-testid="text-result-count">
            {isLoading ? "Loading..." : `${resultCount} provider${resultCount !== 1 ? 's' : ''} found`}
          </p>
          {selectedCategory !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("all")} data-testid="button-clear-filter">
              Clear filter
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <ProviderSkeleton key={i} />
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("services.noResults")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("services.noResultsDesc")}
            </p>
            {search && (
              <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory("all"); }}>
                Clear search
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
