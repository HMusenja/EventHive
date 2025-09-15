// src/pages/TicketSuccess.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getOrderById } from "@/api/orderApi";
import { useAuth } from "@/context/AuthContext";

export default function TicketSuccess() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventId, setEventId] = useState(sp.get("event") || "");
  const [ticketId, setTicketId] = useState(sp.get("ticket") || "");
  const [orderId, setOrderId] = useState(sp.get("order") || "");
  const [ticketRef, setTicketRef] = useState(""); // first line’s ref
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // Try to hydrate from a session snapshot first (useful for guests)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastTicketOrder");
      if (raw) {
        const snap = JSON.parse(raw);
        if (snap?.orderId) setOrderId((prev) => prev || String(snap.orderId));
        if (snap?.eventId) setEventId((prev) => prev || String(snap.eventId));
        if (snap?.ticketId)
          setTicketId((prev) => prev || String(snap.ticketId));
        if (snap?.tickets && snap.tickets.length > 0) {
          setTicketRef((prev) => prev || snap.tickets[0].ref || "");
        }
      }
    } catch (_) {
      /* ignore */
    }
  }, []);

  // If we have an authenticated user and an orderId, fetch the server order to fill gaps.
  useEffect(() => {
    let alive = true;
    (async () => {
      // Only fetch server-side if user is signed in AND we have an orderId
      if (!user?._id || !orderId) return;
      try {
        setLoading(true);
        const { order } = await getOrderById(orderId);
        if (!alive || !order) return;
        setEventId((prev) => prev || String(order.eventId));
        setTicketId((prev) => prev || String(order.ticketId));
        const ref = order?.tickets?.[0]?.ref || "";
        setTicketRef((prev) => prev || ref);
      } catch (e) {
        // show a polite error but don't blow up the whole page
        setErr(
          e?.response?.data?.message ||
            e.message ||
            "Couldn’t load order details"
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?._id, orderId]);

  // Build payload for QR (scanner expects orderId + ticketRef ideally)
  const payload = useMemo(() => {
    if (orderId && ticketRef) {
      return JSON.stringify({
        v: 1,
        type: "event_ticket",
        orderId,
        ticketRef,
        eventId,
      });
    }
    if (eventId && ticketId) {
      return JSON.stringify({ v: 1, type: "event_ticket", eventId, ticketId });
    }
    return "";
  }, [orderId, ticketRef, eventId, ticketId]);

  // Generate QR image
  useEffect(() => {
    let active = true;
    (async () => {
      if (!payload) return;
      try {
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 512,
        });
        if (active) setQrDataUrl(url);
      } catch (e) {
        setErr(e?.message || "Failed to generate QR");
      }
    })();
    return () => {
      active = false;
    };
  }, [payload]);

  function handleDownload() {
    try {
      const canvas = document.createElement("canvas");
      const W = 900,
        H = 1200;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 40px ui-sans-serif, system-ui";
      ctx.fillText("Event Ticket", 60, 90);

      ctx.font = "24px ui-sans-serif, system-ui";
      if (eventId) ctx.fillText(`Event: ${eventId}`, 60, 150);
      if (ticketId) ctx.fillText(`Ticket: ${ticketId}`, 60, 190);
      if (orderId) ctx.fillText(`Order: ${orderId}`, 60, 230);
      if (ticketRef) ctx.fillText(`Ref: ${ticketRef}`, 60, 270);

      if (qrDataUrl) {
        const img = new Image();
        img.onload = () => {
          const qrSize = 600;
          const x = (W - qrSize) / 2;
          const y = 320;
          ctx.drawImage(img, x, y, qrSize, qrSize);

          ctx.font = "20px ui-sans-serif, system-ui";
          ctx.fillStyle = "#6b7280";
          ctx.fillText("Present this code at check-in.", 60, 980);

          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = `ticket-${ticketRef || ticketId || "download"}.png`;
          a.click();
        };
        img.src = qrDataUrl;
      }
    } catch (e) {
      setErr(e?.message || "Download failed");
    }
  }

  const haveAny = Boolean((eventId && ticketId) || (orderId && ticketRef));

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">You're in! 🎉</h1>
        <p className="text-muted-foreground">
          We’ve emailed your ticket. You can also save it below.
        </p>

        {err && (
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        {!haveAny && !loading && (
          <Alert variant="destructive">
            <AlertDescription>
              Missing ticket details. Open this page from your confirmation
              flow.
            </AlertDescription>
          </Alert>
        )}

        {haveAny && (
          <Card>
            <CardHeader>
              <CardTitle>Ticket preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Ticket QR"
                  className="w-[260px] h-[260px] md:w-[320px] md:h-[320px]"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Generating QR…
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                {eventId && (
                  <>
                    Event: <code>{eventId}</code> &middot;{" "}
                  </>
                )}
                {ticketId && (
                  <>
                    Ticket: <code>{ticketId}</code> &middot;{" "}
                  </>
                )}
                {orderId && (
                  <>
                    Order: <code>{orderId}</code> &middot;{" "}
                  </>
                )}
                {ticketRef && (
                  <>
                    Ref: <code>{ticketRef}</code>
                  </>
                )}
              </div>

              <Button onClick={handleDownload} disabled={!qrDataUrl}>
                Download ticket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AUTHENTICATED CTA */}
        {user?._id ? (
          <Card>
            <CardHeader>
              <CardTitle>Tickets in your account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                This ticket is linked to your account. View or manage your
                tickets and event access from your dashboard.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link
                    to={`/events/${eventId}/checkin?orderId=${orderId}&ticketRef=${ticketRef}`}
                  >
                    Check-in
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/events/${eventId || ""}`}>Event page</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* GUEST CTA */
          <Card>
            <CardHeader>
              <CardTitle>Unlock more with a free account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                You’re an attendee. To unlock chat, matchmaking, and your
                profile, create an account or log in.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link
                    to={`/events/${eventId}/checkin?orderId=${orderId}&ticketRef=${ticketRef}`}
                  >
                    Check-in
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to={`/register?next=${encodeURIComponent(`/events/${eventId || ""}/onboarding`)}`}
                  >
                    Create account
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    to={`/login?next=${encodeURIComponent(`/events/${eventId || ""}/onboarding`)}`}
                  >
                    Log in
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
