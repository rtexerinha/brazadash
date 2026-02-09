import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language-context";
import type { YellowPage } from "@shared/schema";
import {
  Search, MapPin, Phone, Mail, DollarSign, Plus, ImagePlus, X,
  Home, Users2, Building2, Car, BedDouble, MessageCircle, Tag
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  room: BedDouble,
  "shared-room": Users2,
  house: Home,
  apartment: Building2,
  car: Car,
  other: Tag,
};

const categoryColors: Record<string, string> = {
  room: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "shared-room": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  house: "bg-green-500/10 text-green-700 dark:text-green-400",
  apartment: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  car: "bg-red-500/10 text-red-700 dark:text-red-400",
  other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export default function YellowPagesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    category: "room",
    price: "",
    city: "",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactWhatsapp: "",
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
      setNewListing((prev) => ({ ...prev, imageUrl: data.url }));
      toast({ title: t("yp.imageUploaded"), description: t("yp.imageUploadedDesc") });
    } catch {
      toast({ title: t("yp.submitError"), description: t("yp.imageUploadError"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const { data: categories } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/community/yellow-pages/categories"],
  });

  const { data: cities } = useQuery<string[]>({
    queryKey: ["/api/community/yellow-pages/cities"],
  });

  const { data: listings, isLoading } = useQuery<YellowPage[]>({
    queryKey: ["/api/community/yellow-pages", selectedCategory, selectedCity, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedCity) params.set("city", selectedCity);
      if (searchQuery) params.set("search", searchQuery);
      const url = `/api/community/yellow-pages${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof newListing) => {
      const res = await apiRequest("POST", "/api/community/yellow-pages", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("yp.submitSuccess"), description: t("yp.submitSuccessDesc") });
      setShowSubmitDialog(false);
      setNewListing({
        title: "", description: "", category: "room", price: "",
        city: "", address: "", contactName: "", contactPhone: "",
        contactEmail: "", contactWhatsapp: "", imageUrl: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community/yellow-pages"] });
    },
    onError: () => {
      toast({ title: t("yp.submitError"), description: t("yp.submitErrorDesc"), variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-yp-title">{t("yp.title")}</h1>
            <p className="text-muted-foreground">{t("yp.subtitle")}</p>
          </div>
          {user && (
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-submit-listing">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("yp.addListing")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("yp.newListing")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t("yp.listingTitle")}</Label>
                    <Input
                      value={newListing.title}
                      onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                      placeholder={t("yp.titlePlaceholder")}
                      data-testid="input-listing-title"
                    />
                  </div>
                  <div>
                    <Label>{t("yp.category")}</Label>
                    <Select
                      value={newListing.category}
                      onValueChange={(value) => setNewListing({ ...newListing, category: value })}
                    >
                      <SelectTrigger data-testid="select-listing-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("yp.description")}</Label>
                    <Textarea
                      value={newListing.description}
                      onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                      placeholder={t("yp.descriptionPlaceholder")}
                      data-testid="input-listing-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("yp.price")}</Label>
                      <Input
                        value={newListing.price}
                        onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                        placeholder="$1,200/mo"
                        data-testid="input-listing-price"
                      />
                    </div>
                    <div>
                      <Label>{t("yp.city")}</Label>
                      <Input
                        value={newListing.city}
                        onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                        placeholder="Los Angeles"
                        data-testid="input-listing-city"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("yp.address")}</Label>
                    <Input
                      value={newListing.address}
                      onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
                      placeholder={t("yp.addressPlaceholder")}
                      data-testid="input-listing-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("yp.contactName")}</Label>
                      <Input
                        value={newListing.contactName}
                        onChange={(e) => setNewListing({ ...newListing, contactName: e.target.value })}
                        data-testid="input-listing-contact-name"
                      />
                    </div>
                    <div>
                      <Label>{t("yp.contactPhone")}</Label>
                      <Input
                        value={newListing.contactPhone}
                        onChange={(e) => setNewListing({ ...newListing, contactPhone: e.target.value })}
                        data-testid="input-listing-contact-phone"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("yp.contactEmail")}</Label>
                      <Input
                        value={newListing.contactEmail}
                        onChange={(e) => setNewListing({ ...newListing, contactEmail: e.target.value })}
                        data-testid="input-listing-contact-email"
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        value={newListing.contactWhatsapp}
                        onChange={(e) => setNewListing({ ...newListing, contactWhatsapp: e.target.value })}
                        data-testid="input-listing-whatsapp"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("yp.listingImage")}</Label>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">{t("yp.imageRecommendation")}</p>
                    {newListing.imageUrl ? (
                      <div className="relative mt-1">
                        <img
                          src={newListing.imageUrl}
                          alt="Listing"
                          className="w-full h-40 object-cover rounded-md"
                          data-testid="img-listing-preview"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-background/80"
                          onClick={() => setNewListing({ ...newListing, imageUrl: "" })}
                          data-testid="button-remove-listing-image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate mt-1"
                        data-testid="label-upload-listing-image"
                      >
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading ? t("yp.uploadingImage") : t("yp.uploadImage")}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          data-testid="input-listing-image"
                        />
                      </label>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => submitMutation.mutate(newListing)}
                    disabled={!newListing.title || !newListing.city || !newListing.category || submitMutation.isPending}
                    data-testid="button-submit-new-listing"
                  >
                    {submitMutation.isPending ? t("yp.submitting") : t("yp.submit")}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("yp.approvalNotice")}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("yp.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-yp"
            />
          </div>
          <Select
            value={selectedCity || "all"}
            onValueChange={(value) => setSelectedCity(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-city-filter">
              <SelectValue placeholder={t("yp.allCities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("yp.allCities")}</SelectItem>
              {cities?.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
            data-testid="button-yp-category-all"
          >
            {t("yp.all")}
          </Button>
          {categories?.map((cat) => {
            const Icon = categoryIcons[cat.id] || Tag;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
                data-testid={`button-yp-category-${cat.id}`}
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
        ) : listings && listings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => {
              const Icon = categoryIcons[listing.category] || Tag;
              return (
                <Card key={listing.id} className="hover-elevate overflow-hidden" data-testid={`card-yp-${listing.id}`}>
                  {listing.imageUrl && (
                    <div className="w-full h-40">
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-yp-${listing.id}`}
                      />
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={categoryColors[listing.category] || categoryColors.other}>
                          <Icon className="h-3 w-3 mr-1" />
                          {listing.category}
                        </Badge>
                        {listing.price && (
                          <Badge variant="secondary">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {listing.price}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base" data-testid={`text-yp-title-${listing.id}`}>
                        {listing.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {listing.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{listing.description}</p>
                    )}
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">
                          {listing.address ? `${listing.address}, ` : ""}{listing.city}, {listing.state}
                        </span>
                      </div>
                      {listing.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${listing.contactPhone}`} className="text-primary hover:underline">
                            {listing.contactPhone}
                          </a>
                        </div>
                      )}
                      {listing.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${listing.contactEmail}`} className="text-primary hover:underline truncate">
                            {listing.contactEmail}
                          </a>
                        </div>
                      )}
                      {listing.contactWhatsapp && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`https://wa.me/${listing.contactWhatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-yp-empty">{t("yp.noListings")}</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory || selectedCity
                ? t("yp.noListingsFiltered")
                : t("yp.noListingsYet")}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
