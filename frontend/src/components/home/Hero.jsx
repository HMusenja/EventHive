import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const heroBgUrl = "/hero-background.jpg";
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: `url(${heroBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_10%,hsl(0_0%_100%/.08),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary">🎉 New Platform Launch</Badge>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
            Connect, Create, <span className="bg-gradient-electric bg-clip-text text-transparent">Celebrate</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/85 sm:text-xl">
            Ticketing, agendas, matchmaking, meetings, chat, and analytics in one bold platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="border-0 bg-gradient-vibrant text-vibrant-foreground hover:shadow-vibrant px-8">
              Start Creating Events <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
