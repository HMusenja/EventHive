import { Zap, Shield, Globe, Users } from "lucide-react";

const featureBlocks = [
  { icon: Zap,    title: "Lightning Fast",    desc: "Create & publish in minutes",   bg: "bg-gradient-vibrant", sh: "shadow-vibrant" },
  { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security",     bg: "bg-gradient-electric", sh: "shadow-electric" },
  { icon: Globe,  title: "Global Reach",      desc: "Engage audiences worldwide",    bg: "bg-gradient-accent",  sh: "shadow-glow" },
  { icon: Users,  title: "Community-Driven",  desc: "Networking, chat, forums",      bg: "bg-gradient-primary", sh: "shadow-glow" },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Why Choose EventHub?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Everything you need to run great events.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {featureBlocks.map((f, i) => (
            <div key={i} className="group text-center">
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${f.bg} ${f.sh} transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
