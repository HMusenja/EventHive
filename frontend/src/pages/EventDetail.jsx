// src/pages/EventPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEvent } from "@/api/eventsApi";
import EventHero from "@/components/event/EventHero";
import AgendaSection from "@/components/event/AgendaSection";
import SpeakersSection from "@/components/event/SpeakersSection";
import VenueMap from "@/components/event/VenueMap";

export default function EventDetail() {
  const { id } = useParams(); // route: /events/:id
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setEvent(await getEvent(id));
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading event…</div>;
  if (err) return <div className="p-8 text-destructive">{err}</div>;
  if (!event) return null;

  return (
    <div className="min-h-dvh">
      <EventHero event={event} />
      <AgendaSection agenda={event.agenda} speakers={event.speakers} timezone={event.timezone} />
      <SpeakersSection speakers={event.speakers} />
      <VenueMap venue={event.venue} />
    </div>
  );
}