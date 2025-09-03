import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TicketTier from "@/components/events/TicketTier";
import { fetchTickets } from "@/services/ticketsApi";

export default function Tickets() {
    const { id: eventId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets(eventId)
            .then(({ tickets }) => setTickets(tickets))
            .finally(() => setLoading(false));
    }, [eventId]);

    const addToCart = (t, qty) => {
        setCart(prev => {
            const i = prev.findIndex(p => p.ticketId === t._id);
            if (i >= 0) {
                const copy = [...prev];
                copy[i] = { ...copy[i], quantity: Math.min(copy[i].quantity + qty, 10) };
                return copy;
            }
            return [...prev, { ticketId: t._id, name: t.name, quantity: qty, unitPriceCents: t.priceCents, currency: t.currency || "eur" }];
        });
    };

    const removeItem = (id) => setCart(prev => prev.filter(i => i.ticketId !== id));

    const totals = useMemo(() => {
        const subtotal = cart.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
        return { subtotal };
    }, [cart]);

    if (loading) return <p className="p-4">Loading tickets…</p>;

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

                {/* For later: a Checkout button that calls the backend */}
                <Button className="w-full" disabled>Checkout (soon)</Button>
            </Card>
        </div>
    );
}
