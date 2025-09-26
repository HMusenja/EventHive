// src/components/event/MyOrganizingGrid.jsx
import { useEffect, useMemo, useState } from "react";
import EventCard from "@/components/event/EventCard";
import { getMyOrganizing } from "@/api/eventsApi";

export default function MyOrganizingGrid() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 3;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const list = await getMyOrganizing();
        if (alive) setEvents(list || []);
      } catch (e) {
        if (alive) setError(e.message || "Failed to load your events");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const totalPages = useMemo(() => Math.ceil((events?.length || 0) / perPage), [events]);
  const pageEvents = useMemo(() => {
    const start = (page - 1) * perPage;
    return events.slice(start, start + perPage);
  }, [events, page]);

  if (loading) return <div className="mt-4 text-muted-foreground">Loading your events…</div>;
  if (error)   return <div className="mt-4 text-destructive">{error}</div>;

  return (
    <div className="space-y-6">
      {pageEvents.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pageEvents.map(ev => <EventCard key={ev._id} event={ev} />)}
        </div>
      ) : (
        <div className="mt-4 text-muted-foreground">You don’t own any events yet.</div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="px-3 py-1 rounded bg-muted text-sm disabled:opacity-50"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-muted text-sm disabled:opacity-50"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
