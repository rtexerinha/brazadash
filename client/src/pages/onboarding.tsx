import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { ShoppingBag, Store, Briefcase, ArrowRight, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

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

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("POST", "/api/user/role", { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
      toast({
        title: t("onboarding.welcomeToast"),
        description: t("onboarding.welcomeToastDesc"),
      });
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
            {t("onboarding.subtitle")}
          </p>
          {t("onboarding.subtitlePt") && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("onboarding.subtitlePt")}
            </p>
          )}
        </div>

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
          onClick={() => selectedRole && setRoleMutation.mutate(selectedRole)}
          data-testid="button-continue-onboarding"
        >
          {setRoleMutation.isPending ? (
            t("onboarding.settingUp")
          ) : (
            <>
              {t("onboarding.continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("onboarding.changeRole")}
        </p>
      </div>
    </div>
  );
}
