import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";

const items = [
  { title: "Tech Innovation Summit", gradient: "bg-gradient-primary", shadow: "shadow-glow" },
  { title: "Global Creators Expo", gradient: "bg-gradient-electric", shadow: "shadow-electric" },
  { title: "Design Futures Forum", gradient: "bg-gradient-vibrant", shadow: "shadow-vibrant" },
  { title: "AI & Ethics Symposium", gradient: "bg-gradient-accent", shadow: "shadow-glow" },
  { title: "FinTech Connect", gradient: "bg-gradient-primary", shadow: "shadow-glow" },
  { title: "DevOps Live", gradient: "bg-gradient-electric", shadow: "shadow-electric" },
];

export default function FeaturedEvents() {
  return (
    <section id="events" className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Featured Events</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Discover standout events worldwide.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((e, i) => (
            <Card key={i} className="group border-border transition-all hover:translate-y-[-2px] hover:shadow-glow">
              <div className={`relative aspect-video overflow-hidden rounded-t-lg ${e.gradient} ${e.shadow}`}>
                <div className="absolute inset-0 bg-black/10" />
                <Badge className="absolute left-4 top-4 bg-white/95 text-foreground">✨ Featured</Badge>
              </div>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Dec 25, 2024
                </div>
                <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">
                  {e.title} {i + 1}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">Explore what’s next in tech, design, and community.</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" /> 250 attending
                  </div>
                  <Button size="sm" variant="outline">Learn More</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
