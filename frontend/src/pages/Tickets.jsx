// src/pages/Tickets.jsx
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TicketCard from "@/components/events/TicketCard";
import GuestCheckoutForm from "@/components/tickets/GuestCheckoutForm";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { checkoutSigned } from "@/api/ticketsApi";
import { useEventTickets } from "@/hooks/useTickets";
import { useState, useMemo } from "react";

export default function Tickets() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { event, eventId, tickets, loading, err } = useEventTickets({ slug, id });

  const [cart, setCart] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [guestMode, setGuestMode] = useState(false);

  const addToCart = (t, qty) => {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.ticketId === t._id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: Math.min(copy[i].quantity + qty, 10) };
        return copy;
      }
      return [
        ...prev,
        {
          ticketId: t._id,
          name: t.name,
          quantity: qty,
          unitPriceCents: t.priceCents || 0,
          currency: (t.currency || "eur").toUpperCase(),
        },
      ];
    });
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.ticketId !== id));
    setSelectedIdx(0);
    setGuestMode(false);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (s, i) => s + (i.unitPriceCents || 0) * i.quantity,
      0
    );
    return { subtotal };
  }, [cart]);

  const selectedLine = cart[selectedIdx] ?? null;
  const selectedTicket = selectedLine
    ? tickets.find((t) => t._id === selectedLine.ticketId)
    : null;

  async function handleCheckout() {
    if (!selectedLine || !eventId) return;
    const { ticketId, quantity } = selectedLine;

    try {
      if (user?._id) {
        const res = await checkoutSigned({ eventId, ticketId, quantity });

        if (res?.mode === "free" && res?.orderId) {
          navigate(
            `/tickets/success?event=${eventId}&ticket=${ticketId}&order=${res.orderId}`
          );
          return;
        }
        if (res?.url) {
          const qs = new URLSearchParams({
            order: res.orderId,
            event: eventId,
            ticket: ticketId,
          });
          navigate(`/pay/dummy-checkout?${qs.toString()}`);
          return;
        }
        toast({ title: "Checkout created", description: "Continue to payment." });
      } else {
        setGuestMode(true);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e.message ||
        "Checkout failed";
      toast({
        title: "Checkout error",
        description: msg,
        variant: "destructive",
      });
    }
  }

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
        {tickets.length === 0 && (
          <Card className="p-6">No tickets available yet.</Card>
        )}

        {tickets.map((t) => (
          <TicketCard
            key={t._id}
            ticket={t}
            eventMeta={{
              title: event?.title || event?.name,
              startAt: event?.startAt,
              endAt: event?.endAt,
              venue: event?.venue,
            }}
            tags={event?.tags || []}
            onAdd={addToCart}
          />
        ))}
      </div>

      <Card className="p-4 h-fit sticky top-4 space-y-3">
        <h3 className="text-lg font-semibold">Order Summary</h3>

        {guestMode ? (
          <GuestCheckoutForm
            eventId={eventId}
            ticket={
              selectedTicket
                ? {
                  _id: selectedTicket._id,
                  name: selectedTicket.name,
                  priceCents: selectedTicket.priceCents || 0,
                  currency: selectedTicket.currency || "eur",
                }
                : null
            }
            onBack={() => setGuestMode(false)}
          />
        ) : (
          <>
            <div className="space-y-2">
              {cart.map((i, idx) => (
                <label
                  key={i.ticketId}
                  className={`flex items-center justify-between text-sm rounded-md border p-2 cursor-pointer ${idx === selectedIdx ? "border-primary" : "border-border"
                    }`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cart-line"
                      checked={idx === selectedIdx}
                      onChange={() => setSelectedIdx(idx)}
                    />
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      {(i.unitPriceCents * i.quantity) / 100}{" "}
                      {i.currency.toUpperCase?.() ||
                        String(i.currency).toUpperCase()}
                    </span>
                    <button
                      className="text-xs text-red-500 underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(i.ticketId);
                      }}
                    >
                      remove
                    </button>
                  </div>
                </label>
              ))}
              {cart.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Your cart is empty.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between font-medium">
              <span>Subtotal</span>
              <span>{(totals.subtotal / 100).toFixed(2)} EUR</span>
            </div>

            <Button
              className="w-full"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              {user?._id ? "Checkout" : "Checkout as Guest or Login"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
