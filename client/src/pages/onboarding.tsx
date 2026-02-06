import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { ShoppingBag, Store, Briefcase, ArrowRight, ArrowLeft, CheckCircle, Send, Upload, ImageIcon } from "lucide-react";

interface VendorInfo {
  name: string;
  description: string;
  cuisine: string;
  city: string;
  address: string;
  phone: string;
}

interface ProviderInfo {
  businessName: string;
  description: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  einNumber: string;
  imageUrl: string;
}

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const { t } = useLanguage();

  const [vendorInfo, setVendorInfo] = useState<VendorInfo>({
    name: "",
    description: "",
    cuisine: "",
    city: "",
    address: "",
    phone: "",
  });

  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    businessName: "",
    description: "",
    category: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    einNumber: "",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  const roles = [
    {
      id: "customer",
      title: t("onboarding.customer"),
      subtitle: t("onboarding.customerSub"),
      description: t("onboarding.customerDesc"),
      icon: ShoppingBag,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      selectedBg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      id: "vendor",
      title: t("onboarding.vendor"),
      subtitle: t("onboarding.vendorSub"),
      description: t("onboarding.vendorDesc"),
      icon: Store,
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/30",
      selectedBg: "bg-primary/10",
    },
    {
      id: "service_provider",
      title: t("onboarding.provider"),
      subtitle: t("onboarding.providerSub"),
      description: t("onboarding.providerDesc"),
      icon: Briefcase,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      selectedBg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  const serviceCategories = [
    { value: "cleaning", label: t("onboarding.categoryCleaning") },
    { value: "beauty", label: t("onboarding.categoryBeauty") },
    { value: "legal", label: t("onboarding.categoryLegal") },
    { value: "fitness", label: t("onboarding.categoryFitness") },
    { value: "auto", label: t("onboarding.categoryAuto") },
    { value: "construction", label: t("onboarding.categoryConstruction") },
    { value: "other", label: t("onboarding.categoryOther") },
  ];

  const setRoleMutation = useMutation({
    mutationFn: async (data: { role: string; businessInfo?: VendorInfo | ProviderInfo }) => {
      const res = await apiRequest("POST", "/api/user/role", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
      if (variables.role === "customer") {
        toast({
          title: t("onboarding.welcomeToast"),
          description: t("onboarding.welcomeToastDesc"),
        });
      } else {
        toast({
          title: t("onboarding.pendingToast"),
          description: t("onboarding.pendingToastDesc"),
        });
      }
    },
    onError: (error: Error) => {
      if (error.message.includes("401")) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: t("onboarding.error"),
        description: t("onboarding.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (!selectedRole) return;
    if (selectedRole === "customer") {
      setRoleMutation.mutate({ role: "customer" });
    } else {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = () => {
    if (!selectedRole) return;
    const businessInfo = selectedRole === "vendor" ? vendorInfo : providerInfo;
    setRoleMutation.mutate({ role: selectedRole, businessInfo });
  };

  const isVendorFormValid = vendorInfo.name.trim() !== "" && vendorInfo.city.trim() !== "" && vendorInfo.phone.trim() !== "";
  const isProviderFormValid = providerInfo.businessName.trim() !== "" && providerInfo.category !== "" && providerInfo.city.trim() !== "" && providerInfo.phone.trim() !== "";

  const isStep2Valid = selectedRole === "vendor" ? isVendorFormValid : isProviderFormValid;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">B</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-onboarding-title">
            {t("onboarding.welcome")}
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-onboarding-subtitle">
            {step === 1 ? t("onboarding.subtitle") : (selectedRole === "vendor" ? t("onboarding.vendorInfoTitle") : t("onboarding.providerInfoTitle"))}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`} data-testid="step-indicator-1">
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <span className={`text-sm font-medium ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>{t("onboarding.step1")}</span>
          </div>
          {selectedRole && selectedRole !== "customer" && (
            <>
              <div className="h-px w-8 bg-border" />
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} data-testid="step-indicator-2">
                  2
                </div>
                <span className={`text-sm font-medium ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>{t("onboarding.step2")}</span>
              </div>
            </>
          )}
        </div>

        {step === 1 && (
          <>
            <div className="space-y-3 mb-8">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                const Icon = role.icon;
                return (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected
                        ? `${role.borderColor} ${role.selectedBg}`
                        : "border-transparent hover-elevate"
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                    data-testid={`card-role-${role.id}`}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${role.bgColor}`}>
                        <Icon className={`h-6 w-6 ${role.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg" data-testid={`text-role-title-${role.id}`}>
                            {role.title}
                          </h3>
                          <span className="text-sm text-muted-foreground">({role.subtitle})</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckCircle className={`h-6 w-6 ${role.color}`} data-testid={`icon-role-selected-${role.id}`} />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-muted" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedRole || setRoleMutation.isPending}
              onClick={handleNext}
              data-testid="button-continue-onboarding"
            >
              {setRoleMutation.isPending ? (
                t("onboarding.settingUp")
              ) : selectedRole === "customer" ? (
                <>
                  {t("onboarding.continue")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  {t("onboarding.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        )}

        {step === 2 && selectedRole === "vendor" && (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-6">{t("onboarding.vendorInfoDesc")}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="restaurant-name" className="flex items-center gap-1">
                      {t("onboarding.restaurantName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="restaurant-name"
                      value={vendorInfo.name}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, name: e.target.value })}
                      placeholder={t("onboarding.restaurantNamePlaceholder")}
                      className="mt-1.5"
                      data-testid="input-restaurant-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurant-desc">{t("onboarding.businessDescription")}</Label>
                    <Textarea
                      id="restaurant-desc"
                      value={vendorInfo.description}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, description: e.target.value })}
                      placeholder={t("onboarding.businessDescriptionPlaceholder")}
                      className="mt-1.5 resize-none"
                      rows={3}
                      data-testid="input-restaurant-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurant-cuisine">{t("onboarding.cuisine")}</Label>
                    <Input
                      id="restaurant-cuisine"
                      value={vendorInfo.cuisine}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, cuisine: e.target.value })}
                      placeholder={t("onboarding.cuisinePlaceholder")}
                      className="mt-1.5"
                      data-testid="input-restaurant-cuisine"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="restaurant-city" className="flex items-center gap-1">
                        {t("onboarding.city")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="restaurant-city"
                        value={vendorInfo.city}
                        onChange={(e) => setVendorInfo({ ...vendorInfo, city: e.target.value })}
                        placeholder={t("onboarding.cityPlaceholder")}
                        className="mt-1.5"
                        data-testid="input-restaurant-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="restaurant-phone" className="flex items-center gap-1">
                        {t("onboarding.phone")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="restaurant-phone"
                        value={vendorInfo.phone}
                        onChange={(e) => setVendorInfo({ ...vendorInfo, phone: e.target.value })}
                        placeholder={t("onboarding.phonePlaceholder")}
                        className="mt-1.5"
                        data-testid="input-restaurant-phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="restaurant-address">{t("onboarding.address")}</Label>
                    <Input
                      id="restaurant-address"
                      value={vendorInfo.address}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, address: e.target.value })}
                      placeholder={t("onboarding.addressPlaceholder")}
                      className="mt-1.5"
                      data-testid="input-restaurant-address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("onboarding.back")}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!isStep2Valid || setRoleMutation.isPending}
                onClick={handleSubmit}
                data-testid="button-submit-registration"
              >
                {setRoleMutation.isPending ? (
                  t("onboarding.submitting")
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("onboarding.submit")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 2 && selectedRole === "service_provider" && (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-6">{t("onboarding.providerInfoDesc")}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="business-name" className="flex items-center gap-1">
                      {t("onboarding.businessName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="business-name"
                      value={providerInfo.businessName}
                      onChange={(e) => setProviderInfo({ ...providerInfo, businessName: e.target.value })}
                      placeholder={t("onboarding.businessNamePlaceholder")}
                      className="mt-1.5"
                      data-testid="input-business-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-desc">{t("onboarding.businessDescription")}</Label>
                    <Textarea
                      id="business-desc"
                      value={providerInfo.description}
                      onChange={(e) => setProviderInfo({ ...providerInfo, description: e.target.value })}
                      placeholder={t("onboarding.providerDescriptionPlaceholder")}
                      className="mt-1.5 resize-none"
                      rows={3}
                      data-testid="input-business-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-category" className="flex items-center gap-1">
                      {t("onboarding.category")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={providerInfo.category}
                      onValueChange={(val) => setProviderInfo({ ...providerInfo, category: val })}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="select-business-category">
                        <SelectValue placeholder={t("onboarding.categoryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} data-testid={`option-category-${cat.value}`}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business-city" className="flex items-center gap-1">
                        {t("onboarding.city")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="business-city"
                        value={providerInfo.city}
                        onChange={(e) => setProviderInfo({ ...providerInfo, city: e.target.value })}
                        placeholder={t("onboarding.cityPlaceholder")}
                        className="mt-1.5"
                        data-testid="input-business-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-phone" className="flex items-center gap-1">
                        {t("onboarding.phone")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="business-phone"
                        value={providerInfo.phone}
                        onChange={(e) => setProviderInfo({ ...providerInfo, phone: e.target.value })}
                        placeholder={t("onboarding.phonePlaceholder")}
                        className="mt-1.5"
                        data-testid="input-business-phone"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business-address">{t("onboarding.address")}</Label>
                      <Input
                        id="business-address"
                        value={providerInfo.address}
                        onChange={(e) => setProviderInfo({ ...providerInfo, address: e.target.value })}
                        placeholder={t("onboarding.addressPlaceholder")}
                        className="mt-1.5"
                        data-testid="input-business-address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-email">{t("onboarding.email")}</Label>
                      <Input
                        id="business-email"
                        type="email"
                        value={providerInfo.email}
                        onChange={(e) => setProviderInfo({ ...providerInfo, email: e.target.value })}
                        placeholder={t("onboarding.emailPlaceholder")}
                        className="mt-1.5"
                        data-testid="input-business-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="business-ein">{t("onboarding.einNumber")}</Label>
                    <Input
                      id="business-ein"
                      value={providerInfo.einNumber}
                      onChange={(e) => setProviderInfo({ ...providerInfo, einNumber: e.target.value })}
                      placeholder="XX-XXXXXXX"
                      className="mt-1.5"
                      data-testid="input-business-ein"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("onboarding.einNumberDesc")}</p>
                  </div>
                  <div>
                    <Label>{t("onboarding.businessImage")}</Label>
                    <div className="mt-1.5">
                      {providerInfo.imageUrl ? (
                        <div className="relative">
                          <img
                            src={providerInfo.imageUrl}
                            alt="Business"
                            className="w-full h-40 object-cover rounded-md"
                            data-testid="img-business-preview"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setProviderInfo({ ...providerInfo, imageUrl: "" })}
                            data-testid="button-remove-business-image"
                          >
                            {t("onboarding.removeImage")}
                          </Button>
                        </div>
                      ) : (
                        <label
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                          data-testid="label-upload-business-image"
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            data-testid="input-business-image"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                toast({ title: t("onboarding.imageTooLarge"), variant: "destructive" });
                                return;
                              }
                              setUploading(true);
                              try {
                                const formData = new FormData();
                                formData.append("image", file);
                                const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
                                if (!res.ok) throw new Error("Upload failed");
                                const data = await res.json();
                                setProviderInfo({ ...providerInfo, imageUrl: data.url });
                              } catch {
                                toast({ title: t("onboarding.uploadFailed"), variant: "destructive" });
                              } finally {
                                setUploading(false);
                              }
                            }}
                          />
                          {uploading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Upload className="h-5 w-5 animate-pulse" />
                              <span className="text-sm">{t("onboarding.uploading")}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <ImageIcon className="h-8 w-8" />
                              <span className="text-sm">{t("onboarding.uploadBusinessImage")}</span>
                              <span className="text-xs">{t("onboarding.imageFormats")}</span>
                            </div>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("onboarding.back")}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!isStep2Valid || setRoleMutation.isPending}
                onClick={handleSubmit}
                data-testid="button-submit-registration"
              >
                {setRoleMutation.isPending ? (
                  t("onboarding.submitting")
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("onboarding.submit")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("onboarding.changeRole")}
        </p>
      </div>
    </div>
  );
}
