// components/events/TicketCard.jsx
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
 * Reusable TicketCard that accepts:
 * - ticket: either a "ticket type" (ticket model) OR an "issued ticket" (from orders/tickets/mine)
 * - eventMeta?: { title, startAt, endAt, venue }
 * - owned?: boolean (if this is an owned/issued ticket)
 * - qrDataUrl, ticketRef, etc.
 *
 * This component normalizes both shapes and renders safely.
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

  // DEV: log unexpected shapes once so we can fine-tune
  // eslint-disable-next-line no-console
  // console.debug("[TicketCard] incoming ticket sample:", ticket);

  // Normalize: issued ticket shape (from /tickets/mine) might be:
  // { _id, ref, ticketId, ticketRef, status, eventMeta, orderId, ... }
  // Ticket type shape (Ticket model) might be:
  // { _id, name, description, currency, priceCents, quantityTotal, quantitySold, salesStartAt, salesEndAt, isActive }
  const normalized = useMemo(() => {
    if (!ticket) {
      return {
        _id: undefined,
        name: "",
        description: "",
        currency: "eur",
        priceCents: 0,
        quantityTotal: 0,
        quantitySold: 0,
        salesStartAt: null,
        salesEndAt: null,
        isActive: true,
        ticketId: null,
        ticketRef: ticketRef || "",
        eventMeta: eventMeta || null,
      };
    }

    // If ticket looks like an issued ticket (has `ref` or `orderId` or ticketRef)
    const isIssued = !!(
      ticket.ref ||
      ticket.orderId ||
      ticket.ticketRef ||
      (ticket.ticketId &&
        typeof ticket.ticketId === "string" &&
        ticket.eventMeta)
    );

    // For issued tickets, the actual ticket type info may be nested in ticket.ticketId (if populated)
    const ticketType =
      ticket.ticketId && typeof ticket.ticketId === "object"
        ? ticket.ticketId
        : null;

    const name =
      ticketType?.name ||
      ticket.name ||
      ticket.ticketName ||
      (ticket.ref ? `Ticket ${ticket.ref}` : ticket.ticketRef) ||
      "Ticket";

    const description =
      ticketType?.description || ticket.description || ticketType?.desc || "";

    const currency = ticketType?.currency || ticket.currency || "eur";

    let priceCents = 0;
    if (ticketType && typeof ticketType.priceCents === "number") {
      priceCents = ticketType.priceCents;
    } else if (typeof ticket.priceCents === "number") {
      priceCents = ticket.priceCents;
    } else if (typeof ticket.amountTotal === "number") {
      const qtyFromTicket = Number(ticket.quantity ?? ticket.qty ?? 1);
      priceCents =
        qtyFromTicket > 0
          ? Math.round(ticket.amountTotal / qtyFromTicket)
          : ticket.amountTotal;
    } else {
      priceCents = 0;
    }
    const quantityTotal =
      (ticketType && typeof ticketType.quantityTotal === "number"
        ? ticketType.quantityTotal
        : null) ??
      (typeof ticket.quantityTotal === "number" ? ticket.quantityTotal : 0);

    const quantitySold =
      (ticketType && typeof ticketType.quantitySold === "number"
        ? ticketType.quantitySold
        : null) ??
      (typeof ticket.quantitySold === "number" ? ticket.quantitySold : 0);

    const salesStartAt =
      (ticketType && ticketType.salesStartAt) ||
      ticket.salesStartAt ||
      ticketType?.salesStartAt ||
      null;

    const salesEndAt =
      (ticketType && ticketType.salesEndAt) ||
      ticket.salesEndAt ||
      ticketType?.salesEndAt ||
      null;

    const isActive =
      (ticketType && typeof ticketType.isActive === "boolean"
        ? ticketType.isActive
        : null) ??
      (typeof ticket.isActive === "boolean" ? ticket.isActive : true);

    const finalEventMeta = eventMeta || ticket.eventMeta || null;

    // ticketRef priority: explicit prop > issued ref > generated ref
    const finalRef = ticketRef || ticket.ref || ticket.ticketRef || "";

    return {
      _id: ticket._id || (ticket._id ? String(ticket._id) : undefined),
      ticketId:
        ticket.ticketId && typeof ticket.ticketId === "string"
          ? ticket.ticketId
          : ticketType?._id
            ? String(ticketType._id)
            : ticketType?._id,
      name,
      description,
      currency,
      priceCents,
      quantityTotal,
      quantitySold,
      salesStartAt,
      salesEndAt,
      isActive,
      ticketRef: finalRef,
      eventMeta: finalEventMeta,
      raw: ticket,
    };
  }, [ticket, eventMeta, ticketRef]);

  // derive useful flags
  const remaining = Math.max(
    (normalized.quantityTotal || 0) - (normalized.quantitySold || 0),
    0
  );
  const soldOut = !normalized.isActive || remaining <= 0;
  const isFree = (normalized.priceCents || 0) === 0;

  const now = new Date();
  const startsAt = normalized.salesStartAt
    ? new Date(normalized.salesStartAt)
    : null;
  const endsAt = normalized.salesEndAt ? new Date(normalized.salesEndAt) : null;
  const notStarted = startsAt && now < startsAt;
  const ended = endsAt && now > endsAt;
  const unavailable = soldOut || notStarted || ended;

  const maxSelectable = Math.max(1, Math.min(maxQty, remaining || 0));

  const priceText = useMemo(() => {
    if (isFree) return "Free";
    const amt = (normalized.priceCents || 0) / 100;
    return `${amt.toFixed(2)} ${String(normalized.currency || "eur").toUpperCase()}`;
  }, [normalized.priceCents, normalized.currency, isFree]);

  const startDateText = normalized.eventMeta?.startAt
    ? new Date(normalized.eventMeta.startAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const timeText =
    normalized.eventMeta?.startAt && normalized.eventMeta?.endAt
      ? `${new Date(normalized.eventMeta.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${new Date(normalized.eventMeta.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : null;

  const venueText = normalized.eventMeta?.venue
    ? `${normalized.eventMeta.venue.name}${normalized.eventMeta.venue.city ? `, ${normalized.eventMeta.venue.city}` : ""}`
    : null;

  function clampQty(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(maxSelectable, n));
  }

  function handleAdd() {
    if (typeof onAdd === "function") onAdd(normalized, qty);
  }

  function handleDownload() {
    const a = document.createElement("a");
    if (qrDataUrl) {
      a.href = qrDataUrl;
      a.download = `ticket-${normalized._id || normalized.ticketRef || "qr"}.png`;
      a.click();
      return;
    }
    const canvas = document.createElement("canvas");
    const W = 900,
      H = 600;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 36px ui-sans-serif, system-ui";
    ctx.fillText(
      normalized.eventMeta?.title || normalized.name || "Event Ticket",
      40,
      70
    );
    ctx.font = "24px ui-sans-serif, system-ui";
    ctx.fillText(`Ticket: ${normalized.name || "-"}`, 40, 120);
    ctx.fillText(`Ref: ${normalized.ticketRef || "-"}`, 40, 160);
    ctx.fillText(`Price: ${priceText}`, 40, 200);
    a.href = canvas.toDataURL("image/png");
    a.download = `ticket-${normalized._id || "download"}.png`;
    a.click();
  }

  function handleShare() {
    const text = `${normalized.eventMeta?.title || normalized.name || "Event"} — ${normalized.name || "Ticket"}${normalized.ticketRef ? ` (${normalized.ticketRef})` : ""}`;
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
            {normalized.eventMeta?.title || normalized.name || "Ticket"}
          </h3>
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <Badge key={`${t}-${i}`} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Badge variant={normalized.isActive ? "default" : "destructive"}>
          {normalized.isActive ? "Active" : "Inactive"}
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
          {normalized.description && (
            <p className="text-sm mt-2">{normalized.description}</p>
          )}
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
            {normalized.ticketRef && (
              <div className="text-center text-xs text-muted-foreground py-2">
                {normalized.ticketRef}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details list */}
      <div className="grid grid-cols-2 gap-y-2">
        <div className="text-sm text-muted-foreground">Ticket Type:</div>
        <div className="text-sm">{normalized.name || "-"}</div>

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
              soldOut
                ? "Sold out"
                : notStarted
                  ? "Sales not started"
                  : ended
                    ? "Sales ended"
                    : "Add to cart"
            }
          >
            {soldOut ? "Sold out" : isFree ? "Get Free Ticket" : "Add to Cart"}
          </Button>
        </div>
      )}
    </Card>
  );
}
