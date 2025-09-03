import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlayCircle } from "lucide-react";
import heroBg from "@/assets/images/hero-background.jpg";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden flex items-center justify-center">
      {/* Background Overlays */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_10%,hsl(0_0%_100%/.08),transparent)]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-y-12 lg:gap-x-20 text-center lg:text-left">
          {/* Left Column */}
          <div className="flex-1 self-start border border-white/30 rounded-lg p-24 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
              <span className="block">Connect, Create,</span>
              <span className="block bg-gradient-electric bg-clip-text lg:text-7xl text-transparent mt-2">
                Celebrate!
              </span>
            </h1>
          </div>

          {/* Right Column (starts from midpoint of left on large screens) */}
          <div className="flex-1 max-w-xl self-start lg:self-center lg:translate-y-1/2">
            <p className="mb-10 text-base sm:text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-sm">
              From ticketing and agendas to smart matchmaking, chat, and
              analytics — everything you need to run unforgettable events, all
              in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:justify-start gap-4 sm:gap-6">
              <Button
                size="lg"
                className="border-0 bg-gradient-vibrant text-vibrant-foreground hover:shadow-vibrant hover:brightness-105 px-8 py-5 text-base sm:text-lg font-semibold focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-vibrant"
              >
                Start Creating Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover: bg-white/10px-8 py-5 text-base sm:text-lg flex items-center gap-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/50"
              >
                <PlayCircle className="h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
        {/* <span className="text-sm text-white/70 mb-1">Scroll to explore</span> */}
        <svg
          className="w-5 h-5 text-white/80"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
