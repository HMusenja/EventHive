// src/components/event/EventHero.jsx
import { Button } from "@/components/ui/button";

export default function EventHero({ event }) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const dateStr = `${start.toLocaleDateString(undefined, { dateStyle: "medium" })} • ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${event.timezone})`;

  return (
    <section className="relative min-h-[60vh] flex items-end">
      {event.coverImage && (
        <div className="absolute inset-0">
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}
      <div className="relative z-10 container px-4 py-12">
        <h1 className="text-3xl md:text-5xl font-bold">{event.title}</h1>
        {event.subtitle && <p className="mt-2 text-muted-foreground">{event.subtitle}</p>}
        <p className="mt-3">{dateStr}</p>
        {event.venue?.name && (
          <p className="text-muted-foreground">{event.venue.name} — {event.venue.city}, {event.venue.country}</p>
        )}
        <div className="mt-6 flex gap-3">
          <Button size="lg">Get Tickets</Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#agenda">View Agenda</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
