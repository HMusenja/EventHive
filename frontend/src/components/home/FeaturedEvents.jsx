// src/components/home/FeaturedEvents.jsx
import { useMemo, useRef } from "react";
import { useEvents } from "@/context/EventContext";
import EventCard from "@/components/event/EventCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function FeaturedEvents() {
  const { state } = useEvents();
  const { events = [], loading, error } = state;
  const firstThree = useMemo(() => events.slice(0, 3), [events]);

  // Mobile carousel ref
  const trackRef = useRef(null);
  const scrollByCard = (dir = 1) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-slide]")?.clientWidth || el.clientWidth;
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: "smooth" });
  };

  return (
    <section id="events" className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-3 sm:mb-8 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold sm:text-4xl">Featured Events</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Discover standout events worldwide.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/events">View all</Link>
          </Button>
        </div>

        {/* Loading skeletons (3 placeholders) */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border animate-pulse">
                <div className="aspect-video rounded-t-lg bg-muted" />
                <CardContent className="p-6">
                  <div className="h-4 w-2/3 bg-muted rounded mb-2" />
                  <div className="h-3 w-1/2 bg-muted rounded mb-4" />
                  <div className="h-9 w-24 bg-muted rounded ml-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-center text-destructive">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && firstThree.length === 0 && (
          <div className="text-center text-muted-foreground">
            No events yet. Check back soon.
          </div>
        )}

        {/* Desktop / md+ — 3-column grid (same size as before) */}
        {!loading && !error && firstThree.length > 0 && (
          <>
            <div className="hidden md:grid grid-cols-1 gap-6 md:grid-cols-3">
              {firstThree.map((ev) => (
                <EventCard key={ev._id} event={ev} />
              ))}
            </div>

            {/* Mobile / sm — horizontal carousel with the same card size */}
            <div className="md:hidden">
              <div className="relative">
                {/* Track */}
                <div
                  ref={trackRef}
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ scrollSnapType: "x mandatory" }}
                  // hide native scrollbar
                  onWheel={(e) => {
                    // enable horizontal wheel scrolling
                    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                      e.currentTarget.scrollLeft += e.deltaY;
                      e.preventDefault();
                    }
                  }}
                >
                  {firstThree.map((ev) => (
                    <div
                      key={ev._id}
                      data-slide
                      className="snap-start shrink-0 basis-full"
                    >
                      {/* The card keeps the same sizing as a grid column: full width of container */}
                      <EventCard event={ev} />
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => scrollByCard(-1)}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => scrollByCard(1)}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
