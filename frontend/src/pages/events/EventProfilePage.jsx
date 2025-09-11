import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, createSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import OnboardCtaButton from "@/components/event/OnboardCtaButton";
import EventProfileEditor from "@/components/onboarding/EventProfileEditor";
import { putAttendeeProfile } from "@/api/onboardingApi";
import { invalidateMyEventMemberCache } from "@/api/onboardingApi";

// --- API helpers (adjust import paths to your project)
import { getEvent } from "@/api/eventsApi"; // getEvent(slug)
import { getMyEventMemberCached } from "@/api/onboardingApi";

// --- Small helpers
function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function EventProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // --------- Data
  const [event, setEvent] = useState(null); // { _id, title, ... }
  const [membership, setMembership] = useState(); // object | null
  const eventId = event?._id;

  // --------- Flags & errors
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [serverErrors, setServerErrors] = useState(null);

  // --------- View & Edit state
  const [view, setView] = useState({
    name: "",
    avatar: "",
    bio: "",
    interests: [],
  });

  const [edit, setEdit] = useState({
    bio: "",
    interests: [],
  });

  const [editMode, setEditMode] = useState(false);

  // Keep baseline for delta-only saves later
  const baselineRef = useRef({ bio: "", interests: [] });

  // Derive read-only lock (e.g., banned/rejected)
  const isLocked = useMemo(() => {
    const s = membership?.status;
    return s === "banned" || s === "rejected";
  }, [membership]);

  // --- Effect: fetch event + membership on mount/slug change
  useEffect(() => {
    let alive = true;
    async function run() {
      setIsFetching(true);
      setFetchError(null);
      try {
        // 1) Event by slug
        const ev = await getEvent(slug); // expects { _id, title, ... }
        if (!alive) return;
        setEvent(ev);

        // 2) My membership for this event
        try {
          const mem = await getMyEventMemberCached(ev._id); // may 404 if not a member
          if (!alive) return;
          setMembership(mem);

          // Prepare view/edit from membership profile fields (adjust to your API shape)
          const fullName =
            mem?.user?.fullName ||
            mem?.profile?.name ||
            mem?.user?.name ||
            "Your name";

          const avatar = mem?.user?.avatar || mem?.profile?.avatar || "";

          const bio = mem?.profile?.bio || "";
          const interests = Array.isArray(mem?.profile?.interests)
            ? mem.profile.interests
            : [];

          const nextView = { name: fullName, avatar, bio, interests };
          if (!alive) return;

          setView(nextView);
          setEdit({ bio, interests });
          baselineRef.current = { bio, interests };
        } catch (err) {
          // Handle membership errors distinctly
          const status = err?.status || err?.response?.status;
          if (status === 401) {
            // Not logged in → redirect to login with next
            const next = `/events/${slug}/me`;
            navigate({
              pathname: "/login",
              search: `?${createSearchParams({ next })}`,
            });
            return;
          }
          if (status === 404) {
            // No membership yet → allow guard rendering with null
            if (!alive) return;
            setMembership(null);
            setView((v) => ({ ...v, name: "Your name" }));
          } else if (status === 403) {
            // Banned/rejected → show read-only
            if (!alive) return;
            // We still want to show what we can (if server includes partial data)
            setMembership(err?.data || { status: "banned" });
          } else {
            throw err;
          }
        }
      } catch (e) {
        if (!alive) return;
        setFetchError(e);
      } finally {
        if (alive) setIsFetching(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [slug, navigate]);

  // --------- Render helpers
  const LoadingCard = (
    <Card>
      <CardHeader>
        <CardTitle>Loading your profile…</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-muted-foreground">
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded" />
      </CardContent>
    </Card>
  );

  const ErrorCard = (
    <Card>
      <CardHeader>
        <CardTitle>Couldn’t load this page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-destructive">
          {fetchError?.message || "An unexpected error occurred."}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  // Guard: Not a member (404)
  const NoMembershipGuard = (
    <Card>
      <CardHeader>
        <CardTitle>You need a ticket to set your event profile.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Buy or claim a ticket first, then you can personalize your profile for
          better networking and recommendations.
        </p>
        {event && <OnboardCtaButton event={event} />}
      </CardContent>
    </Card>
  );

  // View mode (read-only for now—edit wired next step)
  const ViewCard = (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {!isLocked && (
            <Button onClick={() => setEditMode(true)}>Edit profile</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header row */}
        <div className="flex items-center gap-4">
          {/* Avatar (initials fallback) */}
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
            {view.avatar ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={view.avatar}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              getInitials(view.name)
            )}
          </div>
          <div>
            <div className="font-medium">{view.name || "Your name"}</div>
            {event?.title && (
              <div className="text-muted-foreground text-sm">
                Event: {event.title}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div>
          <div className="text-sm font-medium mb-1">Bio</div>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {view.bio?.trim() ? view.bio : "No bio yet."}
          </p>
        </div>

        {/* Interests */}
        <div>
          <div className="text-sm font-medium mb-2">Interests</div>
          {Array.isArray(view.interests) && view.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {view.interests.map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No interests yet.</p>
          )}
        </div>

        {isLocked && (
          <div className="text-sm text-muted-foreground">
            Your membership is{" "}
            <span className="font-medium">{membership?.status}</span>. Editing
            is disabled.
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <section className="container mx-auto max-w-3xl py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Your event profile</h1>
        <p className="text-muted-foreground">
          Event: <span className="font-medium">{event?.title || slug}</span>
        </p>
      </header>

      {/* Loading / Error */}
      {isFetching && LoadingCard}
      {!isFetching && fetchError && ErrorCard}

      {/* Guards & Content */}
      {!isFetching && !fetchError && (
        <>
          {/* 404 membership → guard */}
          {membership === null && NoMembershipGuard}

          {/* has membership (any status) → view (locked if banned/rejected) */}
          {membership && ViewCard}

          {/* Note: editMode will be handled in Step 3 with EventProfileEditor */}
          {editMode && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit profile</CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditMode(false);
                      setEdit({ ...baselineRef.current });
                      setSaveError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {editMode && (
                  <div className="mt-6">
                    <EventProfileEditor
                      eventId={eventId}
                      initialBio={edit.bio}
                      initialInterests={edit.interests}
                      isSaving={isSaving}
                      serverErrors={serverErrors}
                      onCancel={() => {
                        setEditMode(false);
                        setEdit({ ...baselineRef.current });
                        setSaveError(null);
                        setServerErrors(null);
                      }}
                      onSaved={async (next) => {
                        // Build delta-only payload vs baseline
                        const delta = {};
                        if (next.bio !== baselineRef.current.bio)
                          delta.bio = next.bio;
                        const sameInterests =
                          JSON.stringify(next.interests) ===
                          JSON.stringify(baselineRef.current.interests);
                        if (!sameInterests) delta.interests = next.interests;

                        if (Object.keys(delta).length === 0) {
                          setEditMode(false);
                          return;
                        }

                        try {
                          setIsSaving(true);
                          setSaveError(null);
                          setServerErrors(null);

                          await putAttendeeProfile(eventId, delta);
                          await invalidateMyEventMemberCache(eventId);

                          // Update local view + baseline
                          const updated = {
                            ...view,
                            bio: delta.bio ?? view.bio,
                            interests: delta.interests ?? view.interests,
                          };
                          setView(updated);
                          setEdit({
                            bio: updated.bio,
                            interests: updated.interests,
                          });
                          baselineRef.current = {
                            bio: updated.bio,
                            interests: updated.interests,
                          };

                          setEditMode(false);
                          toast({ title: "Profile updated" });
                        } catch (err) {
                          const status = err?.status || err?.response?.status;
                          if (status === 401) {
                            // login redirect with next
                            const nextUrl = `/events/${slug}/me`;
                            navigate({
                              pathname: "/login",
                              search: `?${createSearchParams({ next: nextUrl })}`,
                            });
                            return;
                          }
                          if (status === 403) {
                            // lock editor and keep read-only view
                            setEditMode(false);
                            toast({
                              title: "You can’t edit this profile",
                              description:
                                "Your membership is not permitted to update profiles.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (status === 400) {
                            // Map server validation to inline errors
                            const data = err?.data || err?.response?.data || {};
                            setServerErrors({
                              bio: data?.errors?.bio,
                              interests: data?.errors?.interests,
                              invalidTags: data?.invalidTags,
                            });
                          } else {
                            setSaveError(err);
                            toast({
                              title: "Couldn’t save, try again.",
                              variant: "destructive",
                            });
                          }
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
