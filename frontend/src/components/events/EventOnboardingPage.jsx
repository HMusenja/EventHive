import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getEvent } from "@/api/eventsApi";
import {
  getMyEventMemberCached,
  updateMyEventProfile,
  invalidateMyEventMemberCache,
} from "@/api/onboardingApi";
import { applyToEvent } from "@/api/eventMemberApi";
import { getMyProfile, updateMyProfile } from "@/api/profileApi";
import { useProfile } from "@/context/ProfileContext";
import StepHeader from "@/components/onboarding/StepHeader";
import ProfileStep from "@/components/onboarding/ProfileStep";
import InterestsStep from "@/components/onboarding/InterestsStep";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/* ---------------- helpers for tag diffs ---------------- */
const normalizeTagLocal = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
const normTags = (arr) =>
  Array.from(
    new Set((Array.isArray(arr) ? arr : []).map(normalizeTagLocal))
  ).sort();
const eqTags = (a, b) => {
  const A = normTags(a);
  const B = normTags(b);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

/**
 * Onboarding flow (2 steps) with rollout guard:
 * - Step 1: Edit event-scoped bio (saved on EventMember)
 * - Step 2: Edit user-scoped interests (saved on User)
 * - If onboarding disabled → redirect to event home
 */
export default function EventOnboardingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [event, setEvent] = useState(null);
  const [me, setMe] = useState(null); // cached event-member payload (for bio)

  // local form state
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  const [bio, setBio] = useState("");
  const [bioError, setBioError] = useState(false);

  // USER-scoped interests only
  const [interests, setInterests] = useState([]);
  const [suggestedDefaults, setSuggestedDefaults] = useState([]);

  const baselineRef = useRef({ bio: "", interests: [] });
  const [locked, setLocked] = useState(false); // access lost (403) → disable UI
  const [invalidTags, setInvalidTags] = useState([]); // from 400 payload (interests)
  const [step, setStep] = useState(1);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // 1) Resolve event by slug → id
        const ev = await getEvent(slug);
        if (!alive) return;
        if (!ev?._id) throw new Error("Event not found");
        setEvent(ev);

        // ---- rollout guard (feature flag + overrides) ----
        const qs = new URLSearchParams(location.search);
        const FORCE_ON =
          qs.get("onboarding") === "1" ||
          import.meta.env.VITE_ONBOARDING_FORCE_ENABLE === "1";
        const FORCE_OFF =
          qs.get("onboarding") === "0" ||
          import.meta.env.VITE_ONBOARDING_FORCE_DISABLE === "1";
        const onboardingEnabled = FORCE_ON
          ? true
          : FORCE_OFF
            ? false
            : ev?.onboardingEnabled !== false;

        if (!onboardingEnabled) {
          return navigate(`/events/${slug}`, { replace: true });
        }
        // ✅ global one-time guard: if user has already onboarded anywhere, skip
      if (profile?.hasOnboarded) {
        return navigate(`/events/${slug}/tickets`, { replace: true });
      }

        // 2) Fetch membership (event-scoped data) + User profile (user-scoped interests)
        let memberPayload = null;
        try {
          memberPayload = await getMyEventMemberCached(ev._id); // cached for 60s
        } catch {
          memberPayload = null;
        }
        if (!alive) return;

        await getMyProfile();

        setMe(memberPayload || null);

        // Prefill read-only identity (from membership defaults if present)
        setName(memberPayload?.profile?.name || profile?.fullName || "");
        setAvatar(memberPayload?.profile?.avatar || profile?.avatar || "");

        // Event-scoped bio
        const initialBio = memberPayload?.eventMember?.bio || "";
        setBio(initialBio);

        // USER-scoped interests
        const userInterests = Array.isArray(profile?.interests)
          ? profile.interests
          : [];
        setInterests(userInterests);

        // Suggestions: you can surface the user's own interests as clickable defaults,
        // or compute trending per event. Keep empty to avoid visual noise.
        setSuggestedDefaults([]);

        // Baseline for diffing on save
        baselineRef.current = {
          bio: String(initialBio).trim(),
          interests: normTags(userInterests),
        };
        // ✅ Auto-skip logic
        const completedFlag =
          memberPayload?.eventMember?.onboardingComplete === true;
        const heuristicallyComplete =
          String(initialBio).trim().length > 0 &&
          (userInterests?.length || 0) > 0;

        if (completedFlag || heuristicallyComplete) {
          // Go straight to tickets (or event page if you prefer)
          return navigate(`/events/${slug}/tickets`, { replace: true });
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Couldn’t load onboarding",
          description:
            typeof err?.message === "string"
              ? err.message
              : "Please check your access and try again.",
          variant: "destructive",
        });
        navigate(`/events/${slug}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, navigate, toast, location.search, profile?.hasOnboarded]);

  // Step 1 → Step 2
  function handleContinueFromBio() {
    if (bioError) return;
    setSaveError("");
    setStep(2);
    navigate(`/events/${slug}/onboarding`, { replace: true });
  }

  function handleSkip() {
    setSaveError("");
    setStep(2);
    navigate(`/events/${slug}/onboarding`, { replace: true });
  }

  // Final save (Step 2) — interests (User) + bio (EventMember)
  async function handleSaveInterests(current) {
    try {
      setSaving(true);
      setSaveError("");
      setInvalidTags([]);

      const nextBio = String(bio || "").trim();
      const nextTags = Array.isArray(current) ? current : [];

      const bioChanged = nextBio !== baselineRef.current.bio;
      const interestsChanged = !eqTags(nextTags, baselineRef.current.interests);

      // If nothing changed, just proceed to tickets
      if (!bioChanged && !interestsChanged) {
        invalidateMyEventMemberCache(event._id);
        return navigate(`/events/${slug}/tickets`, { replace: true });
      }

      // 1) Ensure membership exists (idempotent)
      await applyToEvent(event._id);

      // 2) Save event bio if changed (event-scoped)
      if (bioChanged) {
        try {
          await updateMyEventProfile(event._id, {
            bio: nextBio,
            onboardingComplete: true,
          });
          await updateMyProfile({ bio: nextBio });
        } catch (e) {
          const status = e?.response?.status;
          if (status === 401) {
            const next = encodeURIComponent(`/events/${slug}/onboarding`);
            return navigate(`/login?next=${next}`);
          }
          if (status === 403) {
            setLocked(true);
            setSaveError(
              e?.response?.data?.message ||
                "You don’t have permission to update this profile for this event."
            );
            return;
          }
          setSaveError(
            e?.response?.data?.message ||
              e.message ||
              "Couldn’t save bio. Try again."
          );
          return;
        }
      }

      // 3) Save user interests if changed (user-scoped)
      if (interestsChanged) {
        try {
          await updateMyProfile({ interests: nextTags });
        } catch (e3) {
          const status = e3?.response?.status;
          if (status === 401) {
            const next = encodeURIComponent(`/events/${slug}/onboarding`);
            return navigate(`/login?next=${next}`);
          }
          if (status === 400) {
            const msg =
              e3?.response?.data?.message ||
              "Some inputs didn’t pass validation.";
            const bad = e3?.response?.data?.invalidTags || [];
            setInvalidTags(bad);
            setSaveError(
              bad.length ? `${msg} Invalid: ${bad.join(", ")}` : msg
            );
            return;
          }
          setSaveError(
            e3?.response?.data?.message ||
              e3.message ||
              "Couldn’t save interests."
          );
          return;
        }
        // If bio didn’t change, still flip the completion flag now
        if (!bioChanged) {
          try {
            await updateMyEventProfile(event._id, { onboardingComplete: true });
          } catch {
            // non-blocking: if this fails, user can still proceed
          }
        }
      }

      // success — update baseline & invalidate cache
      baselineRef.current = { bio: nextBio, interests: normTags(nextTags) };
      invalidateMyEventMemberCache(event._id);

      // Go to tickets to purchase (paid) or confirm/access (free)
      navigate(`/events/${slug}/tickets`, { replace: true });
    } catch (e) {
      setSaveError(e?.response?.data?.message || e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <StepHeader
          step={1}
          title="Set up your profile"
          subtitle="Tell people a bit about you"
        />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2 w-56">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <StepHeader
        step={step}
        title={`Set up your ${event?.name || "event"} profile`}
        subtitle="This helps you get better matches."
      />

      {locked ? (
        <div className="rounded-xl border p-6 space-y-3">
          <p className="text-sm text-destructive">
            {saveError || "Access restricted for this event."}
          </p>
          <div>
            <button
              onClick={() => navigate(`/events/${slug}/tickets`)}
              className="px-3 py-2 rounded-md border"
            >
              Go to Tickets
            </button>
          </div>
        </div>
      ) : step === 1 ? (
        <ProfileStep
          name={name}
          avatar={avatar}
          bio={bio}
          onBioChange={(v) => {
            setBio(v);
            setBioError(v.length > 1000);
          }}
          onContinue={handleContinueFromBio}
          onSkip={handleSkip}
          busy={saving}
        />
      ) : (
        <div className="space-y-2">
          <InterestsStep
            eventId={event._id} // still useful for autocomplete; not used for saving
            value={interests}
            onChange={setInterests}
            onBack={() => setStep(1)}
            onSave={handleSaveInterests}
            saving={saving}
            error={saveError}
            invalidTags={invalidTags}
            setError={setSaveError}
            suggestedDefaults={suggestedDefaults}
          />
          <p className="text-xs text-muted-foreground">
            Note: Interests are saved to your global profile and used across all
            events.
          </p>
        </div>
      )}
    </div>
  );
}
