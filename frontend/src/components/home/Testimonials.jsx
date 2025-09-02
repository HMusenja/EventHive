import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const items = [
  { name: "Sarah Chen", role: "Organizer", content: "EventHub transformed how I manage conferences.", bg: "bg-gradient-vibrant" },
  { name: "Mike Rodriguez", role: "Workshop Creator", content: "Powerful tools, simple to use.", bg: "bg-gradient-electric" },
  { name: "Emily Johnson", role: "Community Manager", content: "Analytics drive engaging events.", bg: "bg-gradient-accent" },
];

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">What Our Users Say</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Trusted by thousands of creators.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <Card key={i} className="border-border transition-all hover:translate-y-[-2px] hover:shadow-glow">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current text-vibrant" />
                  ))}
                </div>
                <p className="mb-6 text-muted-foreground">“{t.content}”</p>
                <div className="flex items-center">
                  <div className={`mr-3 h-10 w-10 rounded-full ${t.bg}`} />
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
