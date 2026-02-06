import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, MapPin, Star, Clock, Shield, Heart } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { AuthDialog, useAuthDialog } from "@/components/auth-dialog";

export default function LandingPage() {
  const { t } = useLanguage();
  const { openAuthDialog, authDialogProps } = useAuthDialog();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <span className="text-xl font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">Braza</span>
              <span>Dash</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button onClick={openAuthDialog} data-testid="button-login">
              {t("nav.getStarted")}
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {t("landing.badge")}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="text-primary">{t("landing.heroTitle1")}</span>
                <br />
                {t("landing.heroTitle2")}
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                {t("landing.heroDesc")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-base" onClick={openAuthDialog} data-testid="button-hero-cta">
                  <UtensilsCrossed className="mr-2 h-5 w-5" />
                  {t("landing.orderNow")}
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base" data-testid="button-learn-more">
                  <a href="#features">{t("landing.learnMore")}</a>
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>{t("landing.securePayments")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{t("landing.fastDelivery")}</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                <img
                  src="/images/hero-food.png"
                  alt="Delicious Brazilian food spread"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  data-testid="img-hero"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary fill-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{t("landing.rating")}</p>
                    <p className="text-sm text-muted-foreground">{t("landing.happyCustomers")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.whyChoose")} <span className="text-primary">BrazaDash</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.whyChooseDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <UtensilsCrossed className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("landing.authenticCuisine")}</h3>
                <p className="text-muted-foreground">
                  {t("landing.authenticCuisineDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("landing.localCommunity")}</h3>
                <p className="text-muted-foreground">
                  {t("landing.localCommunityDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("landing.fastDeliveryTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("landing.fastDeliveryDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Star className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("landing.verifiedReviews")}</h3>
                <p className="text-muted-foreground">
                  {t("landing.verifiedReviewsDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("landing.securePaymentsTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("landing.securePaymentsDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t("landing.madeWithLove")}</h3>
                <p className="text-muted-foreground">
                  {t("landing.madeWithLoveDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-16">
            <div className="absolute inset-0 bg-[url('/images/hero-food.png')] opacity-10 bg-cover bg-center" />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                {t("landing.readyToTaste")}
              </h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
                {t("landing.readyToTasteDesc")}
              </p>
              <Button size="lg" variant="secondary" onClick={openAuthDialog} data-testid="button-cta-bottom">
                {t("landing.getStartedFree")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-semibold">BrazaDash</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("landing.footer")}
            </p>
          </div>
        </div>
      </footer>

      <AuthDialog {...authDialogProps} />
    </div>
  );
}
