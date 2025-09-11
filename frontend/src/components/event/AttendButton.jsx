// src/components/event/AttendButton.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { applyToEvent } from "@/api/eventMemberApi";
import { getEvent } from "@/api/eventsApi";
import { useToast } from "@/hooks/use-toast"; 

export default function AttendButton({
  event,
  size = "lg",
  variant = "default",
  className = "",
  after = "tickets", // "tickets" | "onboarding"
  children = "Attend",
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const slugOrId = event?.slug || event?._id;
    if (!slugOrId) return;

    // must be authenticated
    if (!user?._id) {
      return navigate(`/login?next=${encodeURIComponent(`/events/${slugOrId}`)}`);
    }

    try {
      setBusy(true);
      // ensure we have the _id (if only slug was passed)
      const ev = event?._id ? event : await getEvent(slugOrId);
      if (!ev?._id) {
        toast({ title: "Event not found", variant: "destructive" });
        return;
      }

      // create or reuse membership
      const res = await applyToEvent(ev._id);
      const member = res?.member;

      // Helpful toast
      toast({
        title: member?.status === "approved" ? "You're in!" : "Request received",
        description:
          member?.status === "approved"
            ? "Your attendee access is active."
            : "You’ve applied to attend. We’ll let you know when it’s approved.",
      });

      // Decide where to send next
      if (after === "onboarding" && member?.status === "approved") {
        navigate(`/events/${slugOrId}/onboarding`);
      } else {
        navigate(`/events/${slugOrId}/tickets`);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Couldn’t process attendance";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size={size} variant={variant} className={className} onClick={handleClick} disabled={busy}>
      {children}
    </Button>
  );
}
