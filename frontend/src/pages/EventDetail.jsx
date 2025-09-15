import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { getEvent } from "@/api/eventsApi";
import { getMyEventMemberCached } from "@/api/onboardingApi";
import {
  getEventAttendeeCountById,
  getEventAttendeeCountBySlug,
} from "@/api/attendeeApi";
import EventHero from "@/components/event/EventHero";
import AgendaSection from "@/components/event/AgendaSection";
import SpeakersSection from "@/components/event/SpeakersSection";
import VenueMap from "@/components/event/VenueMap";

export default function EventDetail() {
  const { slug, id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [membership, setMembership] = useState(undefined);
  const [attendeeCount, setAttendeeCount] = useState(undefined);
  const [checkedInCount, setCheckedInCount] = useState(undefined);
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Load event
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const key = slug || id;
        if (!key) {
          navigate("/events", { replace: true });
          return;
        }
        const ev = await getEvent(key); // supports slug or id
        if (!alive) return;
        setEvent(ev);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load event");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, id, navigate]);

  // Membership (for “My Profile” button)
  useEffect(() => {
    if (!event?._id) return;
    let alive = true;
    (async () => {
      try {
        const mem = await getMyEventMemberCached(event._id);
        if (!alive) return;
        setMembership(mem);
      } catch (e) {
        if (!alive) return;
        const status = e?.status || e?.response?.status;
        if (status === 404) setMembership(null);
        else if (status === 403) setMembership({ status: "banned" });
        else setMembership(undefined); // 401 or other: don’t show button
      }
    })();
    return () => {
      alive = false;
    };
  }, [event?._id]);

  // Attendee count
  useEffect(() => {
    if (!event) return;
    let alive = true;
    (async () => {
      try {
        const data = event._id
          ? await getEventAttendeeCountById(event._id)
          : await getEventAttendeeCountBySlug(event.slug);
        if (!alive) return;
        setAttendeeCount(data?.attendeeCount ?? 0);
        setCheckedInCount(data?.checkedInCount ?? 0); // 👈 NEW
        setMemberCount(data?.memberCount ?? 0);
      } catch {
        if (!alive) return;
        setAttendeeCount(undefined);
        setCheckedInCount(undefined);
        setMemberCount(undefined);
      }
    })();
    return () => {
      alive = false;
    };
  }, [event]);

  const profileUrl = useMemo(() => {
    const s = event?.slug || slug || id;
    return s ? `/events/${s}/me` : "#";
  }, [event, slug, id]);

  if (loading)
    return <div className="p-8 text-muted-foreground">Loading event…</div>;
  if (err) return <div className="p-8 text-destructive">{err}</div>;
  if (!event) return null;

  return (
    <div className="min-h-dvh">
      <EventHero
        event={event}
        membership={membership}
        profileUrl={profileUrl}
        memberCount={memberCount}
        attendeeCount={attendeeCount}
        checkedInCount={checkedInCount}
        chatUrl={`/events/${event._id}/chat`}
      />
      <AgendaSection
        agenda={event.agenda}
        speakers={event.speakers}
        timezone={event.timezone}
      />
      <SpeakersSection speakers={event.speakers} />
      <VenueMap venue={event.venue} />
    </div>
  );
}
