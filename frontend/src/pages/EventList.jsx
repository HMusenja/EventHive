import { useEffect } from "react";
import { useEvents } from "@/context/EventContext";
import EventCard from "@/components/event/EventCard";

export default function EventList() {
  const { state, fetchEvents } = useEvents();
  const { events, loading, error } = state;

  useEffect(() => {
    // Make sure it's loaded if user visits directly
    if (!events?.length) fetchEvents();
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">All Events</h1>
        <p className="mt-2 text-muted-foreground">Browse everything that’s coming up.</p>

        {loading && <div className="mt-8 text-muted-foreground">Loading events…</div>}
        {error && !loading && <div className="mt-8 text-destructive">{error}</div>}

        {!loading && !error && (
          <>
            {events?.length ? (
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((ev) => (
                  <EventCard key={ev._id} event={ev} />
                ))}
              </div>
            ) : (
              <div className="mt-8 text-muted-foreground">No events found.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

