import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getEvent } from "@/api/eventsApi";
import {
  getMyEventMemberCached,
  updateMyEventProfile,
  invalidateMyEventMemberCache,
} from "@/api/onboardingApi";
import { applyToEvent } from "@/api/eventMemberApi";
import StepHeader from "@/components/onboarding/StepHeader";
import ProfileStep from "@/components/onboarding/ProfileStep";
import InterestsStep from "@/components/onboarding/InterestsStep";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/**
 * Onboarding flow (2 steps) with rollout guard:
 * - If onboarding is disabled for the event (or via QA override), redirect to event home.
 */

// helpers for diffs.....................................................................
const normalizeTagLocal = (s) =>
  String(s || "").toLowerCase().trim().replace(/\s+/g, " ");
const normTags = (arr) =>
  Array.from(new Set((Array.isArray(arr) ? arr : []).map(normalizeTagLocal))).sort();
const eqTags = (a, b) => {
  const A = normTags(a);
  const B = normTags(b);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

export default function EventOnboardingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true); // isFetching
  const [saving, setSaving] = useState(false);  // isSaving

  const [event, setEvent] = useState(null);
  const [me, setMe] = useState(null);

  // local form state
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [bioError, setBioError] = useState(false);
  const [interests, setInterests] = useState([]); // normalized array
  const [suggestedDefaults, setSuggestedDefaults] = useState([]);

  const baselineRef = useRef({ bio: "", interests: [] });
  const [locked, setLocked] = useState(false); // access lost (403) → disable UI
  const [invalidTags, setInvalidTags] = useState([]); // from 400 payload

  // wizard
  const [step, setStep] = useState(1);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // 1) resolve event by slug → id
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
        const onboardingEnabled =
          FORCE_ON ? true : FORCE_OFF ? false : ev?.onboardingEnabled !== false;

        if (!onboardingEnabled) {
          // Redirect away if disabled
          return navigate(`/events/${slug}`, { replace: true });
        }

        // 2) fetch my membership/profile defaults (null if none)
        let mine = null;
        try {
          mine = await getMyEventMemberCached(ev._id); // ← cached for 60s
        } catch {
          mine = null;
        }
        if (!alive) return;

        setMe(mine || null);

        // Prefill from server (fallbacks to empty)
        setName(mine?.profile?.name || "");
        setAvatar(mine?.profile?.avatar || "");

        // after fetching /me (prefill)
        setBio(mine?.eventMember?.bio || "");
        const hasMemberInterests =
          Array.isArray(mine?.eventMember?.interests) &&
          mine.eventMember.interests.length > 0;
        const defaultsFromUser = Array.isArray(mine?.defaults?.interests)
          ? mine.defaults.interests
          : [];
        // Selected: only the member’s own interests (if any)
        setInterests(hasMemberInterests ? mine.eventMember.interests : []);
        // Suggestions: user defaults if member has none (not auto-committed)
        setSuggestedDefaults(hasMemberInterests ? [] : defaultsFromUser);

        // set baseline for diffing on save
        baselineRef.current = {
          bio: String(mine?.eventMember?.bio || "").trim(),
          interests: normTags(hasMemberInterests ? mine.eventMember.interests : []),
        };
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
        // Fail-safe: go back to event page if we can’t load
        navigate(`/events/${slug}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, navigate, toast, location.search]);

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

  // Final save (Step 2)
  async function handleSaveInterests(current) {
    try {
      setSaving(true);
      setSaveError("");
      setInvalidTags([]);

      // —— build delta only ——
      const nextBio = String(bio || "").trim();
      const nextTags = Array.isArray(current) ? current : [];
      const payload = {};
      if (nextBio !== baselineRef.current.bio) payload.bio = nextBio;
      if (!eqTags(nextTags, baselineRef.current.interests)) payload.interests = nextTags;

      // If nothing changed, just proceed to tickets
      if (!Object.keys(payload).length) {
        invalidateMyEventMemberCache(event._id);
        return navigate(`/events/${slug}/tickets`, { replace: true });
      }

      // 1) Try to save profile first (if backend allows it pre-membership)
      let saved = false;
      try {
        await updateMyEventProfile(event._id, payload);
        saved = true;
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) {
          const next = encodeURIComponent(`/events/${slug}/onboarding`);
          return navigate(`/login?next=${next}`);
        }
      }

      // 2) Ensure membership exists (apply is idempotent)
      await applyToEvent(event._id);

      // 3) Retry profile save once if it didn't save earlier
      if (!saved) {
        try {
          await updateMyEventProfile(event._id, payload);
          saved = true;
        } catch (e2) {
          const status = e2?.response?.status;
          if (status === 401) {
            const next = encodeURIComponent(`/events/${slug}/onboarding`);
            return navigate(`/login?next=${next}`);
          }
          if (status === 403) {
            setLocked(true);
            setSaveError(
              e2?.response?.data?.message ||
                "You don’t have permission to update this profile for this event."
            );
            return;
          }
          if (status === 400) {
            const msg =
              e2?.response?.data?.message ||
              "Some of your inputs didn’t pass validation.";
            const bad = e2?.response?.data?.invalidTags || [];
            setInvalidTags(bad);
            setSaveError(bad.length ? `${msg} Invalid: ${bad.join(", ")}` : msg);
            return;
          }
          setSaveError(
            e2?.response?.data?.message || e2.message || "Couldn’t save, try again."
          );
          return;
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
        <StepHeader step={1} title="Set up your profile" subtitle="Tell people a bit about you" />
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
        <InterestsStep
          eventId={event._id}
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
      )}
    </div>
  );
}
