// src/pages/TicketSuccess.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TicketSuccess() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  // Spec requires these in the URL
  const eventId = sp.get("event");
  const ticketId = sp.get("ticket");

  // Optional fallback if user hit this via order param only
  const orderId = sp.get("order");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [err, setErr] = useState(null);

  // Encode a simple payload for scanners (can evolve later)
  const payload = useMemo(() => {
    if (!eventId || !ticketId) return "";
    return JSON.stringify({
      v: 1,
      type: "event_ticket",
      eventId,
      ticketId,
    });
  }, [eventId, ticketId]);

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

  async function handleDownload() {
    try {
      // Compose a PNG “ticket” with canvas
      const canvas = document.createElement("canvas");
      const W = 900, H = 1200;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Title
      ctx.fillStyle = "#111827";
      ctx.font = "bold 40px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("Event Ticket", 60, 90);

      // Details
      ctx.font = "24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(`Event: ${eventId || "—"}`, 60, 150);
      ctx.fillText(`Ticket: ${ticketId || "—"}`, 60, 190);
      if (orderId) ctx.fillText(`Order: ${orderId}`, 60, 230);

      // QR
      if (qrDataUrl) {
        const img = new Image();
        img.onload = () => {
          const qrSize = 600;
          const x = (W - qrSize) / 2;
          const y = 300;
          ctx.drawImage(img, x, y, qrSize, qrSize);

          ctx.font = "20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
          ctx.fillStyle = "#6b7280";
          ctx.fillText("Present this code at check-in.", 60, 980);

          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = `ticket-${ticketId || "download"}.png`;
          a.click();
        };
        img.src = qrDataUrl;
      } else {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `ticket-${ticketId || "download"}.png`;
        a.click();
      }
    } catch (e) {
      setErr(e?.message || "Download failed");
    }
  }

  const ready = !!eventId && !!ticketId;

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">You're in! 🎉</h1>
        <p className="text-muted-foreground">
          We’ve emailed your ticket and QR code. You can also save the ticket below.
        </p>

        {!ready && (
          <Alert variant="destructive">
            <AlertDescription>
              Missing ticket details. Please open your ticket from the confirmation email or go back.
            </AlertDescription>
          </Alert>
        )}
        {err && (
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        {ready && (
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
                <div className="text-sm text-muted-foreground">Generating QR…</div>
              )}

              <div className="text-sm text-muted-foreground">
                Event: <code>{eventId}</code> &middot; Ticket: <code>{ticketId}</code>
                {orderId && <> &middot; Order: <code>{orderId}</code></>}
              </div>

              <Button onClick={handleDownload} disabled={!qrDataUrl}>
                Download ticket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upsell CTA to login/register (auth modal if you have one) */}
        <Card>
          <CardHeader>
            <CardTitle>Unlock more with a free account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              You’re an attendee. To unlock chat, matchmaking, and your profile, create an account or log in.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link to={`/register?next=${encodeURIComponent(`/events/${eventId || ""}/onboarding`)}`}>
                  Create account
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/login?next=${encodeURIComponent(`/events/${eventId || ""}/onboarding`)}`}>
                  Log in
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
