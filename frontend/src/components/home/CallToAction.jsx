import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-5xl">Ready to Start Your Event Journey?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-white/85 sm:text-lg">
            Join thousands who trust EventHub to bring their vision to life.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="border-0 bg-gradient-vibrant text-vibrant-foreground hover:shadow-vibrant px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
