import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, MapPin, Star, Clock, Shield, Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Now serving California
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="text-primary">Sabor brasileiro</span>
                <br />
                na sua porta
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Discover authentic Brazilian cuisine from your favorite restaurants. 
                From feijoada to pao de queijo, experience the taste of Brazil right here in California.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-base" data-testid="button-hero-cta">
                  <a href="/api/login">
                    <UtensilsCrossed className="mr-2 h-5 w-5" />
                    Order Now
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base" data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure payments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Fast delivery</span>
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
                    <p className="font-semibold">4.9 Rating</p>
                    <p className="text-sm text-muted-foreground">10k+ happy customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher <span className="text-primary">BrazaDash</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We bring the authentic taste of Brazil to your doorstep with care and quality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <UtensilsCrossed className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Authentic Brazilian Cuisine</h3>
                <p className="text-muted-foreground">
                  From traditional feijoada to street-style coxinhas, experience genuine Brazilian flavors prepared by passionate cooks.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Community</h3>
                <p className="text-muted-foreground">
                  Connect with Brazilian restaurants and home cooks right in your neighborhood. Support your local community.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
                <p className="text-muted-foreground">
                  Get your favorite Brazilian dishes delivered hot and fresh. Track your order in real-time from kitchen to door.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Star className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Verified Reviews</h3>
                <p className="text-muted-foreground">
                  Make informed decisions with honest reviews from real customers. Every rating is from a verified order.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
                <p className="text-muted-foreground">
                  Your transactions are protected with industry-standard encryption. Pay with confidence using your preferred method.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-0 bg-card">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Made with Love</h3>
                <p className="text-muted-foreground">
                  Every dish is prepared with the same love and care as a Brazilian home-cooked meal. Saudade never tasted so good.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-16">
            <div className="absolute inset-0 bg-[url('/images/hero-food.png')] opacity-10 bg-cover bg-center" />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to taste Brazil?
              </h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
                Join thousands of Brazilians in California enjoying authentic food from the comfort of their homes.
              </p>
              <Button size="lg" variant="secondary" asChild data-testid="button-cta-bottom">
                <a href="/api/login">
                  Get Started - It's Free
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
              © 2024 BrazaDash. Feito com amor para a comunidade brasileira.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
