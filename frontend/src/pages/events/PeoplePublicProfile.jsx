import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PeoplePublicProfile() {
  const { slug, memberId } = useParams();
  return (
    <section className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Attendee Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Public profile for member <span className="font-mono">{memberId}</span> (event: {slug})
          </p>
          <p className="text-sm text-muted-foreground">
            TODO: fetch `/api/events/:eventId/attendees/:memberId` and render details.
          </p>
          <Button asChild variant="outline">
            <Link to={`/events/${slug}/people`}>Back to people</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
