import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent } from "@/api/eventsApi";
import { getMyEventMemberCached } from "@/api/onboardingApi";
import { getMatchSuggestions } from "@/api/matchApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TagChips from "@/components/people/TagChips";
import PeopleCard from "@/components/people/PeopleCard";
import PeopleCardSkeleton from "@/components/people/PeopleCardSkeleton";

export default function PeopleSuggestionsPage() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [membership, setMembership] = useState(undefined);
  const [myInterests, setMyInterests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [selectedTag, setSelectedTag] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Load event → membership + suggestions
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setIsFetching(true);
        setFetchError(null);

        const ev = await getEvent(slug);
        if (!alive) return;
        setEvent(ev);

        const [memRes, list] = await Promise.all([
          getMyEventMemberCached(ev._id).catch((e) => e),
          getMatchSuggestions(ev._id, { limit: 20 }),
        ]);
        if (!alive) return;

        if (memRes && !memRes.status) {
          setMembership(memRes);
          const mine = Array.isArray(memRes?.profile?.interests)
            ? memRes.profile.interests
            : [];
          setMyInterests(mine);
        } else {
          setMembership(null);
          setMyInterests([]);
        }

        setSuggestions(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setFetchError(e);
      } finally {
        if (alive) setIsFetching(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  const editProfileUrl = useMemo(() => {
    const s = event?.slug || slug;
    return `/events/${s}/me?edit=1`;
  }, [event, slug]);

  // ----- Tag cloud (frequency of interests across suggestions)
  const tagCloud = useMemo(() => {
    const freq = new Map();
    for (const s of suggestions) {
      const ints = Array.isArray(s?.profile?.interests)
        ? s.profile.interests
        : [];
      for (const t of ints) freq.set(t, (freq.get(t) || 0) + 1);
    }
    // sort by frequency desc, then alpha; cap to 20
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 20);
  }, [suggestions]);

  // ----- Client-side filter
  const filtered = useMemo(() => {
    if (!selectedTag) return suggestions;
    return suggestions.filter((s) =>
      (s?.profile?.interests || []).includes(selectedTag)
    );
  }, [suggestions, selectedTag]);

  if (isFetching) {
    return (
      <section className="container mx-auto max-w-5xl py-8">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <PeopleCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section className="container mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Couldn’t load suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-3">
              {fetchError?.message || "Unexpected error"}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const noInterests = myInterests.length === 0;

  return (
    <section className="container mx-auto max-w-5xl py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            People you might want to meet
          </h1>
          <p className="text-muted-foreground">
            {noInterests
              ? "Add some interests to improve suggestions."
              : "Suggestions are based on shared interests."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={editProfileUrl}>Edit my interests</Link>
        </Button>
      </header>

      {/* Filters row */}
      <TagChips
        tags={tagCloud}
        selected={selectedTag}
        onSelect={setSelectedTag}
      />
      {/* Empty states */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {noInterests ? (
              <>
                Add a few interests to get better suggestions.{" "}
                <Link className="underline" to={editProfileUrl}>
                  Edit your profile
                </Link>
                .
              </>
            ) : selectedTag ? (
              <>
                No matches for{" "}
                <span className="font-medium">{selectedTag}</span>. Try a
                different tag.
              </>
            ) : (
              <>No suggestions yet. Try adding more interests.</>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results  */}
      {filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((s) => {
            const fullName = s?.user?.fullName || "Attendee";
            const avatar = s?.user?.avatar || "";
            const bio = s?.profile?.bio || "";
            const interests = Array.isArray(s?.profile?.interests)
              ? s.profile.interests
              : [];
            const shared = myInterests.filter((t) => interests.includes(t));
            const other = interests.filter((t) => !shared.includes(t));
            const slugSafe = event?.slug || slug;
            const profileUrl = `/events/${slugSafe}/attendees/${s.memberId}`;

            return (
              <PeopleCard
                key={s.memberId}
                fullName={fullName}
                avatar={avatar}
                bio={bio}
                shared={shared}
                other={other}
                profileUrl={profileUrl}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
