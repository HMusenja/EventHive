import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmartGetTicketButton from "./SmartGetTicketButton";

export default function EventHero({ event, membership, profileUrl, attendeeCount, memberCount, checkedInCount, chatUrl }) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);


  const dateStr = `${start.toLocaleDateString(undefined, {
    dateStyle: "medium",
  })} • ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${event.timezone})`;

  const hasProfile =
    membership &&
    membership.status !== "banned" &&
    membership.status !== "rejected";

  const pluralize = (n, s, p = s + "s") => `${n} ${n === 1 ? s : p}`;


  return (
    <section className="relative min-h-[60vh] flex items-end">
      {event.coverImage && (
        <div className="absolute inset-0">
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}
      <div className="relative z-10 container px-4 py-12">
        <h1 className="text-3xl md:text-5xl font-bold">{event.title}</h1>
        {event.subtitle && <p className="mt-2 text-muted-foreground">{event.subtitle}</p>}
        <p className="mt-3">{dateStr}</p>

        {event.venue?.name && (
          <p className="text-muted-foreground">
            {event.venue.name} — {event.venue.city}, {event.venue.country}
          </p>
        )}

        {/* Counts */}
        {(typeof attendeeCount === "number" || typeof checkedInCount === "number") && (
          <div className="mt-2 flex items-center gap-3 text-sm">
            {typeof memberCount === "number" && (
              <span className="text-muted-foreground">
                {pluralize(memberCount, "member")}
              </span>
            )}
            {typeof attendeeCount === "number" && (
              <span className="text-muted-foreground">
                {pluralize(attendeeCount, "attendee")}
              </span>
            )}
            {typeof checkedInCount === "number" && (
              <Badge variant="secondary" title="Checked in at the venue">
                {pluralize(checkedInCount, "checked in")}
              </Badge>
            )}
          </div>
        )}


        <div className="mt-6 flex flex-wrap gap-3">
          <SmartGetTicketButton event={event}>
            Get Tickets
          </SmartGetTicketButton>


          <Button variant="outline" size="lg" asChild>
            <a href="#agenda">View Agenda</a>
          </Button>

          {chatUrl && (
            <Link to={chatUrl}>
              <Button variant="default" size="lg">
                💬 Join Event Chat
              </Button>
            </Link>
          )}

          {hasProfile && (
            <Button size="lg" asChild>
              <Link to={profileUrl}>My Profile</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

