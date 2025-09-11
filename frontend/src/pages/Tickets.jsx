import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TicketTier from "@/components/events/TicketTier";
import { fetchTickets } from "@/services/ticketsApi";
import { getEvent } from "@/api/eventsApi";

export default function Tickets() {
  const { slug, id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [eventId, setEventId] = useState(id || "");
  const [tickets, setTickets] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 1) Resolve event by slug or id → set eventId
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const key = slug || id;
        if (!key) return navigate("/events", { replace: true });

        const ev = await getEvent(key); // works with slug or id
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
  }, [slug, id, navigate]);

  // 2) Fetch tickets after we have a valid eventId
  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchTickets(eventId);
        if (!alive) return;
        setTickets(res.tickets || []);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load tickets");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [eventId]);

  const addToCart = (t, qty) => {
    setCart(prev => {
      const i = prev.findIndex(p => p.ticketId === t._id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: Math.min(copy[i].quantity + qty, 10) };
        return copy;
      }
      return [...prev, {
        ticketId: t._id,
        name: t.name,
        quantity: qty,
        unitPriceCents: t.priceCents,
        currency: t.currency || "eur",
      }];
    });
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.ticketId !== id));

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
    return { subtotal };
  }, [cart]);

  if (loading) return <p className="p-4">Loading tickets…</p>;

  if (err) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6 text-destructive">Failed to load: {err}</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        {tickets.length === 0 && <Card className="p-6">No tickets available yet.</Card>}
        {tickets.map(t => <TicketTier key={t._id} ticket={t} onAdd={addToCart} />)}
      </div>

      <Card className="p-4 h-fit sticky top-4 space-y-3">
        <h3 className="text-lg font-semibold">Order Summary</h3>
        <div className="space-y-2">
          {cart.map(i => (
            <div key={i.ticketId} className="flex items-center justify-between text-sm">
              <span>{i.name} × {i.quantity}</span>
              <div className="flex items-center gap-2">
                <span>{(i.unitPriceCents * i.quantity / 100).toFixed(2)} {i.currency.toUpperCase()}</span>
                <button className="text-xs text-red-500 underline" onClick={() => removeItem(i.ticketId)}>remove</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
        </div>

        <div className="pt-2 flex items-center justify-between font-medium">
          <span>Subtotal</span>
          <span>{(totals.subtotal / 100).toFixed(2)} EUR</span>
        </div>

        <Button className="w-full" disabled>Checkout (soon)</Button>
      </Card>
    </div>
  );
}
