import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createMeeting } from "@/api/meetingsApi";
import { useAuth } from "@/context/AuthContext";
import AvailabilityPicker from "@/components/meetings/AvailabilityPicker";

/**
 * RequestMeetingModal
 * Props:
 *  - open, onClose
 *  - hostId (required)  -> the user you want to meet
 *  - eventId (optional) -> if present, meeting is event-scoped
 */
export default function RequestMeetingModal({ open, onClose, hostId, eventId }) {
  const [date, setDate] = useState(new Date());
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  if (!open) return null;

  const toISO = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    try { return new Date(v).toISOString(); } catch { return ""; }
  };

  const submit = async () => {
    if (!hostId) {
      toast({ title: "Missing user", description: "No invitee specified.", variant: "destructive" });
      return;
    }
    if (!slot) {
      toast({ title: "Pick a time", description: "Please choose a time slot first." });
      return;
    }
    if (user?._id && String(user._id) === String(hostId)) {
      toast({ title: "Cannot invite yourself", variant: "destructive" });
      return;
    }

    const startAt = toISO(slot.startAt);
    const endAt = toISO(slot.endAt);
    if (!startAt || !endAt || new Date(startAt) >= new Date(endAt)) {
      toast({
        title: "Invalid time range",
        description: "Please pick a valid start and end time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await createMeeting({
        eventId: eventId || undefined,       // omit if falsy
        inviteeId: hostId,
        startAt,
        endAt,
        location: eventId ? "in-person" : "online",
        message: note?.trim() ? note.trim() : undefined,
      });
      toast({ title: "Request sent", description: "Your meeting request was created." });
      onClose?.();
    } catch (e) {
      const code = e?.response?.status;
      const data = e?.response?.data;
      if (code === 401) {
        toast({ title: "You’re signed out", description: "Please log in again.", variant: "destructive" });
      } else if (code === 409) {
        toast({
          title: "Time slot not available",
          description: data?.message || "This overlaps another meeting.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to create meeting",
          description: data?.message || e?.message || "Please try another slot.",
          variant: "destructive",
        });
      }
      console.error("[RequestMeetingModal] createMeeting error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/70 backdrop-blur-sm">
      <div className="w-[min(640px,92vw)] rounded-2xl border bg-background p-4 shadow-xl">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">Request a meeting</h3>
          <p className="text-sm text-muted-foreground">
            Pick a time that works and send a request.
          </p>
        </div>

        <div className="grid gap-4">
          <AvailabilityPicker
            hostId={hostId}
            date={date}
            onDateChange={setDate}
            slotMinutes={30}
            onSelect={setSlot}
          />

          <div className="grid gap-1">
            <label className="text-sm font-medium">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border bg-background px-3 py-2"
              placeholder="What would you like to discuss?"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="rounded-xl border px-4 py-2 hover:bg-muted" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
            onClick={submit}
            disabled={loading || !slot}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}
