import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Clock,
  MapPin,
  Download,
  Share2,
  QrCode,
} from "lucide-react";

/**
 * Reusable TicketCard
 *
 * Props:
 * - ticket: {
 *     _id, name, description, currency, priceCents,
 *     quantityTotal, quantitySold, salesStartAt, salesEndAt, isActive
 *   }
 * - eventMeta?: { title, startAt, endAt, venue?: { name, city } }
 * - tags?: string[]
 * - rating?: number
 * - owned?: boolean
 * - qrDataUrl?: string
 * - ticketRef?: string
 * - onAdd?: (ticket, qty) => void
 * - maxQty?: number
 */
export default function TicketCard({
  ticket,
  eventMeta,
  tags = [],
  rating,
  owned = false,
  qrDataUrl = "",
  ticketRef = "",
  onAdd,
  maxQty = 10,
}) {
  const [qty, setQty] = useState(1);

  const {
    _id,
    name,
    description,
    currency = "eur",
    priceCents = 0,
    quantityTotal = 0,
    quantitySold = 0,
    salesStartAt,
    salesEndAt,
    isActive = true,
  } = ticket || {};

  const remaining = Math.max((quantityTotal ?? 0) - (quantitySold ?? 0), 0);
  const soldOut = !isActive || remaining <= 0;
  const isFree = (priceCents || 0) === 0;

  const now = new Date();
  const startsAt = salesStartAt ? new Date(salesStartAt) : null;
  const endsAt   = salesEndAt   ? new Date(salesEndAt)   : null;
  const notStarted = startsAt && now < startsAt;
  const ended = endsAt && now > endsAt;
  const unavailable = soldOut || notStarted || ended;

  const maxSelectable = Math.max(1, Math.min(maxQty, remaining || 0));

  const priceText = useMemo(() => {
    if (isFree) return "Free";
    const amt = (priceCents || 0) / 100;
    return `${amt.toFixed(2)} ${String(currency || "eur").toUpperCase()}`;
  }, [priceCents, currency, isFree]);

  const startDateText = eventMeta?.startAt
    ? new Date(eventMeta.startAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const timeText =
    eventMeta?.startAt && eventMeta?.endAt
      ? `${new Date(eventMeta.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${new Date(eventMeta.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : null;

  const venueText = eventMeta?.venue
    ? `${eventMeta.venue.name}${eventMeta.venue.city ? `, ${eventMeta.venue.city}` : ""}`
    : null;

  function clampQty(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(maxSelectable, n));
  }

  function handleAdd() {
    if (typeof onAdd === "function") onAdd(ticket, qty);
  }

  function handleDownload() {
    // If we have a QR image, just download that; otherwise generate a basic PNG with text.
    const a = document.createElement("a");
    if (qrDataUrl) {
      a.href = qrDataUrl;
      a.download = `ticket-${_id || "qr"}.png`;
      a.click();
      return;
    }
    // Fallback canvas
    const canvas = document.createElement("canvas");
    const W = 900, H = 600;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 36px ui-sans-serif, system-ui";
    ctx.fillText(eventMeta?.title || "Event Ticket", 40, 70);
    ctx.font = "24px ui-sans-serif, system-ui";
    ctx.fillText(`Ticket: ${name || "-"}`, 40, 120);
    ctx.fillText(`Ref: ${ticketRef || "-"}`, 40, 160);
    ctx.fillText(`Price: ${priceText}`, 40, 200);
    a.href = canvas.toDataURL("image/png");
    a.download = `ticket-${_id || "download"}.png`;
    a.click();
  }

  function handleShare() {
    const text = `${eventMeta?.title || "Event"} — ${name || "Ticket"}${ticketRef ? ` (${ticketRef})` : ""}`;
    if (navigator?.share) {
      navigator.share({ title: "My Ticket", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  }

  return (
    <Card className="p-5 space-y-4">
      {/* Header: title + status */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold leading-tight">
            {eventMeta?.title || name || "Ticket"}
          </h3>
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Meta row: date / time / venue + QR panel */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          {startDateText && (
            <div className="flex items-center gap-2">
              <CalendarDays size={16} />
              <span className="text-sm">{startDateText}</span>
            </div>
          )}
          {timeText && (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span className="text-sm">{timeText}</span>
            </div>
          )}
          {venueText && (
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="text-sm">{venueText}</span>
            </div>
          )}
          {description && <p className="text-sm mt-2">{description}</p>}
          {(notStarted || ended) && (
            <div className="text-xs text-muted-foreground mt-1">
              {notStarted && <>On sale from {startsAt.toLocaleString()}</>}
              {ended && <>Sales ended on {endsAt.toLocaleString()}</>}
            </div>
          )}
        </div>

        {/* QR side (owned only) */}
        {owned && (
          <div className="w-[160px] shrink-0 grid place-items-center rounded-md border">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Ticket QR"
                className="w-[120px] h-[120px] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground py-6">
                <QrCode className="w-12 h-12" />
                <div className="text-xs mt-2">QR available after issue</div>
              </div>
            )}
            {ticketRef && (
              <div className="text-center text-xs text-muted-foreground py-2">
                {ticketRef}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details list */}
      <div className="grid grid-cols-2 gap-y-2">
        <div className="text-sm text-muted-foreground">Ticket Type:</div>
        <div className="text-sm">{name || "-"}</div>

        <div className="text-sm text-muted-foreground">Price:</div>
        <div className="text-sm font-medium">{priceText}</div>

        {!owned && (
          <>
            <div className="text-sm text-muted-foreground">Remaining:</div>
            <div className="text-sm">{remaining}</div>
          </>
        )}

        {typeof rating === "number" && (
          <>
            <div className="text-sm text-muted-foreground">Rating:</div>
            <div className="text-sm">⭐ {rating}</div>
          </>
        )}
      </div>

      {/* Actions */}
      {owned ? (
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Qty</span>
            <Input
              type="number"
              min={1}
              max={maxSelectable}
              value={qty}
              onChange={(e) => setQty(clampQty(e.target.value))}
              className="w-20"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={unavailable || !onAdd || qty < 1 || qty > maxSelectable}
            title={
              soldOut ? "Sold out" :
              notStarted ? "Sales not started" :
              ended ? "Sales ended" : "Add to cart"
            }
          >
            {soldOut ? "Sold out" : isFree ? "Get Free Ticket" : "Add to Cart"}
          </Button>
        </div>
      )}
    </Card>
  );
}
