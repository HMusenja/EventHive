import Hero from "@/components/home/Hero";
import FeaturedEvents from "@/components/home/FeaturedEvents";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import Testimonials from "@/components/home/Testimonials";
import BlogPreview from "@/components/home/BlogPreview";
import CallToAction from "@/components/home/CallToAction";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <FeaturedEvents />
      <FeaturesGrid />
      <Testimonials />
      <BlogPreview />
      <CallToAction />
    </div>
  );
}
