import { useEffect } from "react";
import Hero from "@/components/home/Hero";
import FeaturedEvents from "@/components/home/FeaturedEvents";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import Testimonials from "@/components/home/Testimonials";
import BlogPreview from "@/components/home/BlogPreview";
import CallToAction from "@/components/home/CallToAction";

export default function Home() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100); // slight delay ensures content is rendered
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <section id="events" className="scroll-mt-24">
        <FeaturedEvents />
      </section>
      <section id="features" className="scroll-mt-24">
        <FeaturesGrid />
      </section>
      <section id="about" className="scroll-mt-24">
        <Testimonials />
      </section>
      <section id="blog" className="scroll-mt-24">
        <BlogPreview />
      </section>
      <CallToAction />
    </div>
  );
}
