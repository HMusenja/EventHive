// src/hooks/useTickets.js
import { useEffect, useState } from "react";
import { fetchTickets, fetchMyTickets } from "@/api/ticketsApi";
import { getEvent } from "@/api/eventsApi";
import { useAuth } from "@/context/AuthContext";

export function useEventTickets({ slug, id }) {
  const [event, setEvent] = useState(null);
  const [eventId, setEventId] = useState(id || "");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const key = slug || id;
        if (!key) return;

        const ev = await getEvent(key);
        if (!alive) return;
        if (!ev?._id) throw new Error("Event not found");

        setEvent(ev);
        setEventId(ev._id);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load event");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, id]);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchTickets(eventId);
        if (!alive) return;
        setTickets(Array.isArray(list) ? list : []);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load tickets");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [eventId]);

  return { event, eventId, tickets, loading, err };
}

export function useMyTickets(userId) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false); // ✅ don’t hang if userId missing
      return;
    }
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await fetchMyTickets(userId);

        console.log("useMyTickets API result:", res); // ✅ debug

        // handle both { data: [...] } and plain []
        const list = Array.isArray(res?.data) ? res.data : res;
        if (!alive) return;
        setTickets(Array.isArray(list) ? list : []);
      } catch (e) {
        setErr(
          e?.response?.data?.message ||
          e.message ||
          "Failed to load tickets"
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  return { tickets, loading, err };
}