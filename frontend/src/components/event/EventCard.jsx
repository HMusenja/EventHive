import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

function fmtDateRange(startAt, endAt, tz) {
  const s = startAt ? new Date(startAt) : null;
  const e = endAt ? new Date(endAt) : null;
  if (!s || isNaN(s)) return "Date TBA";
  const sameDay = e && !isNaN(e) && s.toDateString() === e.toDateString();

  const dLabel = s.toLocaleDateString(undefined, { dateStyle: "medium" });
  const tStart = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const tEnd   = e && !isNaN(e) ? e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return sameDay && tEnd
    ? `${dLabel} • ${tStart}–${tEnd}${tz ? ` (${tz})` : ""}`
    : `${dLabel}${tStart ? ` • ${tStart}` : ""}${tEnd ? ` – ${tEnd}` : ""}${tz ? ` (${tz})` : ""}`;
}

export default function EventCard({ event }) {
  const {
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
  } = event || {};

  const dateStr = fmtDateRange(startAt, endAt, timezone);
  const cityLabel = [venue?.city, venue?.country].filter(Boolean).join(", ");
  const countsLabel = `${agenda.length || 0} session${agenda.length === 1 ? "" : "s"} · ${speakers.length || 0} speaker${speakers.length === 1 ? "" : "s"}`;

  return (
    <Link to={`/events/${slug}`} className="block group">
      <Card className="border-border transition-all hover:translate-y-[-2px] hover:shadow-glow">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {coverImage ? (
            <img src={coverImage} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          <Badge className="absolute left-4 top-4 bg-white/95 text-foreground">✨ Featured</Badge>
        </div>

        <CardContent className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {dateStr}
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
          {subtitle && <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {countsLabel}
            </div>
            <Button size="sm" variant="outline" asChild>
              <span>Learn More</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}