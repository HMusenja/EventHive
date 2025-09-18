import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RequestMeetingButton from "@/components/meetings/RequestMeetingButton";

function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] || "") + (p[1]?.[0] || "");
}

export default function PeopleCard({
  fullName = "Attendee",
  avatar = "",
  bio = "",
  shared = [],
  other = [],
  profileUrl = "#",
  // NEW: pass these when you render the card
  hostId,          // ← MUST be a User ID (Meeting model expects User refs)
  eventId = null,  // ← optional, include if meetings belong to an event
}) {
  const shortBio = bio && bio.length > 160 ? bio.slice(0, 157) + "…" : bio;

  return (
    <article aria-labelledby={`person-${fullName}`} className="h-full">
      <Card className="h-full">
        <CardContent className="p-4 flex gap-4">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
            {avatar ? (
              <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="font-semibold" aria-hidden>{initials(fullName).toUpperCase()}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div id={`person-${fullName}`} className="font-medium truncate">
              {fullName}
            </div>

            {shortBio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3" title={bio}>
                {shortBio}
              </p>
            )}

            {/* Tags */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shared.map((t) => (
                <Badge key={`s-${t}`} aria-label={`Shared interest ${t}`}>{t}</Badge>
              ))}
              {other.map((t) => (
                <Badge key={`o-${t}`} variant="secondary">{t}</Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-3">
              <Button size="sm" asChild>
                <a href={profileUrl}>View profile</a>
              </Button>
              {/* NEW: Request a meeting with this person */}
              {hostId && (
                <RequestMeetingButton hostId={hostId} eventId={eventId} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
