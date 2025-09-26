// components/events/EventCard.jsx
import { memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Eye,
  Pencil,
  Trash2,
  Euro,
} from "lucide-react";
// If you don't have shadcn Progress, keep the small Bar fallback below.
// import { Progress } from "@/components/ui/progress";

function Bar({ value = 0 }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-2 rounded-full bg-foreground/80 transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function fmtDateRange(startAt, endAt, tz) {
  const s = startAt ? new Date(startAt) : null;
  const e = endAt ? new Date(endAt) : null;
  if (!s || isNaN(s)) return "Date TBA";
  const sameDay = e && !isNaN(e) && s.toDateString() === e.toDateString();

  const dLabel = s.toLocaleDateString(undefined, { dateStyle: "medium" });
  const tStart = s.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const tEnd =
    e && !isNaN(e)
      ? e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

  return sameDay && tEnd
    ? `${dLabel} • ${tStart}–${tEnd}${tz ? ` (${tz})` : ""}`
    : `${dLabel}${tStart ? ` • ${tStart}` : ""}${tEnd ? ` – ${tEnd}` : ""}${tz ? ` (${tz})` : ""}`;
}

const statusStyles = {
  live: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ended: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  soldout: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};
function StatusBadge({ status = "live" }) {
  const key = String(status).toLowerCase();
  const cls = statusStyles[key] || statusStyles.live;
  const label =
    key === "live"
      ? "Live"
      : key === "draft"
        ? "Draft"
        : key === "ended"
          ? "Ended"
          : key === "soldout"
            ? "Sold out"
            : status;
  return <Badge className={`border ${cls}`}>{label}</Badge>;
}

function money(n, currency = "EUR") {
  return (Number(n) || 0).toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}
export default memo(function EventCard({
  event,
  variant = "public", // "public" | "organizer"
  onView, // optional override handlers
  onEdit,
  onDelete,
  footerSlot = null,
}) {
  const navigate = useNavigate();

  const {
    _id,
    slug,
    title,
    subtitle,
    coverImage,
    startAt,
    endAt,
    timezone,
    venue,
    speakers = [],
    agenda = [],

    // organizer-only fields (rename here if your API differs)
    attendees = 0,
    capacity = 0,
    price, // number
    revenue, // number
    currency = "EUR",
    status = "live",
  } = event || {};

  const dateStr = fmtDateRange(startAt, endAt, timezone);
  const cityLabel = [venue?.city, venue?.country].filter(Boolean).join(", ");
  const countsLabel = `${agenda.length || 0} session${agenda.length === 1 ? "" : "s"} · ${speakers.length || 0} speaker${speakers.length === 1 ? "" : "s"}`;
  const pct = useMemo(() => {
    const cap = event.capacityTotal ?? capacity ?? 0;
    const att = event.attendeeCount ?? attendees ?? 0;
    return cap > 0 ? Math.round((att / cap) * 100) : 0;
  }, [event.capacityTotal, event.attendeeCount, attendees, capacity]);

  if (variant === "organizer") {
    // ORGANIZER DASHBOARD RENDER
    return (
      <Card className="border-border transition-all hover:translate-y-[-2px] hover:shadow-glow overflow-hidden rounded-2xl">
        {/* Cover image header */}
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        <CardContent className="p-6">
          {/* Title + status */}
          <div className="flex items-start gap-3">
            <h3 className="text-xl font-bold text-foreground flex-1 leading-tight">
              {title}
            </h3>
            <StatusBadge status={status} />
          </div>

          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}

          {/* Meta rows */}
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{dateStr}</span>
            </div>
            {cityLabel && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{cityLabel}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {event.attendeeCount ?? attendees}/
                {event.capacityTotal ?? capacity} attendees
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Euro className="h-4 w-4" />
              <span>
                {money(revenue, currency)} •{" "}
                {price !== undefined
                  ? money(price, currency) + "/ticket"
                  : "Free"}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Actions + progress */}
          <div className="flex flex-col gap-3">
            {/* Actions row */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() =>
                  onView ? onView(event) : navigate(`/events/${slug}`)
                }
                aria-label="View"
                title="View"
              >
                <Eye className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() =>
                  onEdit
                    ? onEdit(event)
                    : navigate(`/dashboard/organizer/events/${_id}/edit`)
                }
                aria-label="Edit"
                title="Edit"
              >
                <Pencil className="h-5 w-5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All associated data
                      (tickets, attendees, etc.) may also be removed depending
                      on your backend rules.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete?.(event)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* inline slot area */}
              {footerSlot && (
                <>
                  <div className="mx-2 h-4 w-px bg-border" />
                  {footerSlot}
                </>
              )}
            </div>

            {/* Progress row */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {/* Use shadcn <Progress value={pct} /> if available */}
                <Bar value={pct} />
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {pct}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PUBLIC RENDER (your original UI, unchanged)
  return (
    <Link to={`/events/${slug}`} className="block group">
      <Card className="border-border transition-all hover:translate-y-[-2px] hover:shadow-glow">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          <Badge className="absolute left-4 top-4 bg-white/95 text-foreground">
            ✨ Featured
          </Badge>
        </div>

        <CardContent className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />{" "}
              {fmtDateRange(startAt, endAt, timezone)}
            </span>
            {cityLabel && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {cityLabel}
              </span>
            )}
          </div>

          <h3 className="mb-1 text-lg font-semibold group-hover:text-primary transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />{" "}
              {`${agenda.length || 0} session${agenda.length === 1 ? "" : "s"} · ${speakers.length || 0} speaker${speakers.length === 1 ? "" : "s"}`}
            </div>
            <Button size="sm" variant="outline" asChild>
              <span>Learn More</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
