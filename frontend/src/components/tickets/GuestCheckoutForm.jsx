// src/components/ticket/GuestCheckoutForm.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkoutGuest } from "@/services/ticketsApi";

export default function GuestCheckoutForm({
  eventId,
  ticket,         // { _id, name, priceCents, currency }
  onBack,         // callback to go back to button row
}) {
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [qty, setQty]             = useState(1);
  const [consent, setConsent]     = useState(false);
  const [promo, setPromo]         = useState("");   // disabled UX
  const [submitting, setSubmitting] = useState(false);
  const [errBanner, setErrBanner] = useState(null);
  const navigate = useNavigate();

  const isFree = (ticket?.priceCents || 0) === 0;
  const totalText = useMemo(() => {
    if (!ticket) return "";
    if (isFree) return "Free";
    const amt = ((ticket.priceCents || 0) * qty) / 100;
    return `${amt.toFixed(2)} ${(ticket.currency || "eur").toUpperCase()}`;
  }, [ticket, qty, isFree]);

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const canSubmit = ticket?._id && consent && emailOk && fullName.trim().length >= 2 && qty >= 1 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setErrBanner(null);
    setSubmitting(true);
    try {
      const res = await checkoutGuest({
        eventId,
        ticketId: ticket._id,
        fullName,
        email,
        quantity: qty,
      });

      // Free → success screen
      if (res?.success && res?.mode === "free" && res?.orderId) {
       navigate(`/tickets/success?event=${eventId}&ticket=${ticket._id}`);
        return;
      }
      // Paid → redirect to dummy session URL
    if (res?.url) {
  const qs = new URLSearchParams();
  qs.set("order", res.orderId);
  qs.set("event", eventId);
  qs.set("ticket", ticket._id);
  // SPA navigate so your router catches the route
  navigate(`/pay/dummy-checkout?${qs.toString()}`);
  return;
}
      // Fallback: just show success screen
      navigate("/tickets/success");
    } catch (err) {
      if (err?.code === "EMAIL_EXISTS") {
        setErrBanner({ code: err.code, message: "This email already has an account. Please log in or register to continue." });
      } else {
        setErrBanner({ code: err?.code || "HTTP_ERROR", message: err?.message || "Something went wrong" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      {errBanner && (
        <Alert variant="destructive">
          <AlertDescription>{errBanner.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
            className="mt-1"
            placeholder="Ada Lovelace"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            placeholder="ada@example.com"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            max={20}
            value={qty}
            onChange={(e) => {
              const v = Number(e.target.value);
              const clamped = Number.isFinite(v) ? Math.max(1, Math.min(20, v)) : 1;
              setQty(clamped);
            }}
            className="mt-1"
          />
          {ticket && <div className="text-xs text-muted-foreground mt-1">Total: {totalText}</div>}
        </div>

        {/* Promo code (disabled for now) */}
        <div>
          <Label htmlFor="promo">Promo code</Label>
          <Input
            id="promo"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            className="mt-1"
            placeholder="Coming soon"
            disabled
          />
          <div className="text-xs text-muted-foreground mt-1">Promo codes not supported yet.</div>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="consent" checked={!!consent} onCheckedChange={(v) => setConsent(!!v)} />
        <Label htmlFor="consent" className="leading-snug">
          I agree to the Terms and Privacy Policy and consent to receive ticket emails.
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          {submitting ? "Processing..." : isFree ? "Get Free Ticket" : "Continue to Payment"}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
      </div>
    </form>
  );
}
