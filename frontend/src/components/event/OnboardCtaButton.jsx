import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Get Tickets CTA — ALWAYS sends the user to onboarding first (auth-gated).
 * Membership is created later when the user saves their onboarding profile.
 */
export default function OnboardCtaButton({
  event,
  size = "lg",
  variant = "default",
  className = "",
  children = "Get Tickets",
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const slug = event?.slug;
  const id = event?._id;

  const onboardingPath = slug
    ? `/events/${slug}/onboarding`
    : id
      ? `/events/id/${id}/onboarding`
      : null;
  const ticketsPath = slug
    ? `/events/${slug}/tickets`
    : id
      ? `/events/id/${id}/tickets`
      : null;
  const loginNext = encodeURIComponent(onboardingPath || "/events");

  // rollout guard: per-event flag + global overrides
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
      : event?.onboardingEnabled !== false;

  function handleClick() {
    if (!onboardingPath) return;
    if (!user?._id) {
      // send them to login, then straight back to onboarding
      return navigate(`/login?next=${loginNext}`);
    }
    setBusy(true);
    if (onboardingEnabled) {
      navigate(onboardingPath);
    } else {
      // rollout disabled → go straight to tickets
      navigate(ticketsPath || "/events");
    }
    setBusy(false);
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={busy}
    >
      {children}
    </Button>
  );
}
