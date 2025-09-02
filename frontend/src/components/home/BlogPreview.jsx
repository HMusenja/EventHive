import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const posts = [
  { title: "10 Tips for Virtual Events", date: "Dec 20, 2024", read: "5 min read", bg: "bg-gradient-vibrant" },
  { title: "The Future of Hybrid Events", date: "Dec 18, 2024", read: "7 min read", bg: "bg-gradient-electric" },
  { title: "Building Community Through Events", date: "Dec 15, 2024", read: "6 min read", bg: "bg-gradient-accent" },
];

export default function BlogPreview() {
  return (
    <section id="blog" className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Latest Insights</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Trends, tips, and deep dives.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((p, i) => (
            <Card key={i} className="group border-border transition-all hover:translate-y-[-2px] hover:shadow-glow">
              <div className={`aspect-video rounded-t-lg ${p.bg}`} />
              <CardContent className="p-6">
                <div className="mb-2 text-sm text-muted-foreground">{p.date} • {p.read}</div>
                <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">Read our practical guide for creators.</p>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-electric hover:text-electric/80">
                  Read More <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
