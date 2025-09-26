// src/pages/DummyCheckout.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { completeDummyPayment } from "@/api/ticketsApi";

export default function DummyCheckout() {
  const [sp] = useSearchParams();
  const orderId = sp.get("order");
  const eventId = sp.get("event");
  const ticketId = sp.get("ticket");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const fired = useRef(false);

  async function handlePay() {
    if (!orderId) return;
    setBusy(true);
    setErr(null);
    try {
      await completeDummyPayment(orderId);
      const qs = new URLSearchParams();
      qs.set("order", orderId);
      if (eventId) qs.set("event", eventId);
      if (ticketId) qs.set("ticket", ticketId);
      navigate(`/tickets/success?${qs.toString()}`);
    } catch (e) {
      setErr(e?.message || "Payment failed");
      fired.current = false
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-semibold mb-2">Dummy Checkout</h1>
      <p className="text-muted-foreground mb-6">
        This simulates a payment step for development. Order: <code>{orderId || "—"}</code>
      </p>
      {err && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}
      <Button onClick={handlePay} disabled={!orderId || busy}>
        {busy ? "Processing..." : "Simulate Payment Success"}
      </Button>
    </div>
  );
}

