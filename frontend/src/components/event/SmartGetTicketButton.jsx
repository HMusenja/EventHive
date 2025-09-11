// src/components/event/SmartGetTicketButton.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import OnboardCtaButton from "./OnboardCtaButton";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { fetchTickets, checkoutGuest } from "@/services/ticketsApi"

// Small inline form purpose-built for the guest flow in this modal
function GuestCheckoutForm({ eventId, ticket, onBack }) {
  const navigate = useNavigate();
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [qty, setQty]             = useState(1);
  const [consent, setConsent]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errBanner, setErrBanner] = useState(null);

  const isFree = (ticket?.priceCents || 0) === 0;
  const totalText = useMemo(() => {
    if (!ticket) return "";
    if (isFree) return "Free";
    const amt = ((ticket.priceCents || 0) * qty) / 100;
    return `${amt.toFixed(2)} ${(ticket.currency || "eur").toUpperCase()}`;
  }, [ticket, qty, isFree]);

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const canSubmit =
    ticket?._id &&
    consent &&
    emailOk &&
    fullName.trim().length >= 2 &&
    qty >= 1 &&
    !submitting;

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

      if (res?.success && res?.mode === "free" && res?.orderId) {
        navigate(`/tickets/success?order=${res.orderId}`);
        return;
      }
      if (res?.url) {
        navigate(`/pay/dummy-checkout?order=${res.orderId}`);
        return;
      }
      // Fallback
      navigate("/tickets/success");
    } catch (err) {
      if (err?.code === "EMAIL_EXISTS") {
        setErrBanner({
          code: err.code,
          message:
            "This email already has an account. Please log in or register to continue.",
        });
      } else {
        setErrBanner({
          code: err?.code || "HTTP_ERROR",
          message: err?.message || "Something went wrong",
        });
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
              const clamped = Number.isFinite(v)
                ? Math.max(1, Math.min(20, v))
                : 1;
              setQty(clamped);
            }}
            className="mt-1"
          />
          {ticket && (
            <div className="text-xs text-muted-foreground mt-1">
              Total: {totalText}
            </div>
          )}
        </div>
        {/* Promo intentionally omitted/disabled per your spec */}
      </div>

      <div className="flex items-start gap-2">
        {/* shadcn Checkbox returns boolean or 'indeterminate' in some versions; coerce to boolean */}
        <input
          id="consent"
          type="checkbox"
          className="h-4 w-4 mt-1"
          checked={!!consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <Label htmlFor="consent" className="leading-snug">
          I agree to the Terms and Privacy Policy and consent to receive ticket emails.
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          {submitting
            ? "Processing..."
            : isFree
            ? "Get Free Ticket"
            : "Continue to Payment"}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
      </div>
    </form>
  );
}

export default function SmartGetTicketButton({
  event,
  size = "lg",
  variant = "default",
  className = "",
  children = "Get Tickets",
}) {
  const { user } = useAuth();

  // ---------- Signed-in users → delegate to OnboardCtaButton ----------
  if (user?._id) {
    return (
      <OnboardCtaButton
        event={event}
        size={size}
        variant={variant}
        className={className}
      >
        {children}
      </OnboardCtaButton>
    );
  }

  // ---------- Guests: modal state + logic ----------
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketId, setTicketId] = useState("");
  const [guestMode, setGuestMode] = useState(false);

  // Load active tickets when modal opens
  useEffect(() => {
    if (!open || !event?._id) return;
    (async () => {
      try {
        const list = await fetchTickets(event._id); // returns []
        setTickets(list);
        if (list.length && !ticketId) setTicketId(list[0]._id);
      } catch {
        // ignore; select will be empty
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?._id]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t._id === ticketId),
    [tickets, ticketId]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setGuestMode(false); }}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          {children}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Get a ticket for {event.title}</DialogTitle>
          <DialogDescription>
            Continue as guest to buy a ticket without creating an account,
            or log in / register to unlock Match, Chat, and your public Profile.
          </DialogDescription>
        </DialogHeader>

        {/* Ticket selector (stay outside the form; form consumes selectedTicket) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Ticket type</Label>
            <Select value={ticketId} onValueChange={setTicketId}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a ticket" />
              </SelectTrigger>
              <SelectContent>
                {tickets.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}{" "}
                    {(t.priceCents || 0) === 0
                      ? "— Free"
                      : `— ${(t.priceCents / 100).toFixed(2)} ${
                          t.currency ? t.currency.toUpperCase() : ""
                        }`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CTA row → swaps to form when guestMode = true */}
        {!guestMode ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={() => setGuestMode(true)}
              disabled={!ticketId}
            >
              Continue as Guest
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={`/login?next=${encodeURIComponent(`/events/${event.slug || `id/${event._id}`}/onboarding`)}`}>
                Login
              </a>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a href={`/register?next=${encodeURIComponent(`/events/${event.slug || `id/${event._id}`}/onboarding`)}`}>
                Register
              </a>
            </Button>
          </div>
        ) : (
          <GuestCheckoutForm
            eventId={event._id}
            ticket={selectedTicket}
            onBack={() => setGuestMode(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
