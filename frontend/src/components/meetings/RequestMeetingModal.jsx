import { useState } from "react";
import AvailabilityPicker from "./AvailabilityPicker";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

/**
 * RequestMeetingModal
 * Props:
 *  - open, onClose
 *  - hostId (required)
 *  - eventId (optional)
 */
export default function RequestMeetingModal({ open, onClose, hostId, eventId }) {
  const [date, setDate] = useState(new Date());
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!open) return null;

  const submit = async () => {
    if (!slot) {
      toast({ title: "Pick a time", description: "Please choose a time slot first." });
      return;
    }
    try {
      setLoading(true);
      await api.post("/meetings", {
        eventId: eventId || null,
        inviteeId: hostId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        message: note || undefined,
      });
      toast({ title: "Request sent", description: "Your meeting request was created." });
      onClose?.();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create meeting", description: "Please try another slot.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/70 backdrop-blur-sm">
      <div className="w-[min(640px,92vw)] rounded-2xl border bg-background p-4 shadow-xl">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">Request a meeting</h3>
          <p className="text-sm text-muted-foreground">Pick a time that works and send a request.</p>
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
              onChange={(e)=>setNote(e.target.value)}
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
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}