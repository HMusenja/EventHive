import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createMeeting } from "@/api/meetingsApi";
import { useAuth } from "@/context/AuthContext";
import AvailabilityPicker from "@/components/meetings/AvailabilityPicker";

/**
 * Props:
 *  - open, onClose
 *  - hostId (required)
 *  - eventId (optional)
 *  - sentCount (optional)
 *  - onCreated(meeting) (optional)
 */
export default function RequestMeetingModal({
  open,
  onClose,
  hostId,
  eventId,
  sentCount = 0,
  onCreated,
}) {
  const { toast } = useToast();
  const { user } = useAuth();

  // date + manual from/to times (local)
  const [dateStr, setDateStr] = useState(() => toDateInputValue(new Date()));
  const [fromTime, setFromTime] = useState(""); // "HH:MM"
  const [toTime, setToTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("online");     // "online" | "in-person"
  const [place, setPlace] = useState("");

  // reset fields whenever modal opens or host changes
  useEffect(() => {
    if (open) {
      setDateStr(toDateInputValue(new Date()));
      setFromTime("");
      setToTime("");
      setNote("");
    }
  }, [open, hostId]);

  const descId = "request-meeting-desc";

  // Build ISO strings from date + time (hooks MUST be unconditional)
  const startAtISO = useMemo(
    () => combineLocalDateTimeToISO(dateStr, fromTime),
    [dateStr, fromTime]
  );
  const endAtISO = useMemo(
    () => combineLocalDateTimeToISO(dateStr, toTime),
    [dateStr, toTime]
  );

  async function submit() {
    if (!hostId) {
      toast({ title: "Missing user", description: "No invitee specified.", variant: "destructive" });
      return;
    }
    if (!fromTime || !toTime) {
      toast({ title: "Pick a time", description: "Please set both From and To." });
      return;
    }
    if (mode === "in-person" && !place.trim()) {
      toast({ title: "Add a place", description: "Please provide where to meet.", variant: "destructive" });
      return;
    }
    if (!startAtISO || !endAtISO) {
      toast({ title: "Invalid time", description: "Please use valid times like 09:30 → 10:00.", variant: "destructive" });
      return;
    }
    if (new Date(startAtISO) >= new Date(endAtISO)) {
      toast({ title: "Invalid range", description: "‘To’ must be after ‘From’.", variant: "destructive" });
      return;
    }
    if (user?._id && String(user._id) === String(hostId)) {
      toast({ title: "Cannot invite yourself", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const meeting = await createMeeting({
        eventId: eventId || undefined,
        inviteeId: hostId,
        startAt: startAtISO,
        endAt: endAtISO,
        location: mode,                          // "online" or "in-person"
        venue: mode === "in-person" ? place.trim() : undefined, // optional
        message: note?.trim() ? note.trim() : undefined,
      });

      toast({
        title: "Request sent",
        description:
          sentCount > 0
            ? `You’ve sent ${sentCount + 1} request${sentCount + 1 === 1 ? "" : "s"} to this person.`
            : "Your meeting request was created.",
      });

      onCreated?.(meeting, hostId);
      onClose?.();
    } catch (e) {
      const code = e?.response?.status;
      const data = e?.response?.data;
      if (code === 401) {
        toast({ title: "You’re signed out", description: "Please log in again.", variant: "destructive" });
      } else if (code === 409) {
        toast({ title: "Time slot not available", description: data?.message || "This overlaps another meeting.", variant: "destructive" });
      } else {
        toast({ title: "Failed to create meeting", description: data?.message || e?.message || "Please try another time.", variant: "destructive" });
      }
      console.error("[RequestMeetingModal] createMeeting error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Render nothing only AFTER all hooks have run
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/70 backdrop-blur-sm">
      <div
        className="w-[min(640px,92vw)] rounded-2xl border bg-background p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-describedby={descId}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Request a meeting</h3>
            <p id={descId} className="text-sm text-muted-foreground">
              Choose a date and your own From/To time.
            </p>
          </div>

          {sentCount > 0 && (
            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
              Sent {sentCount} time{sentCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                className="rounded-xl border bg-background px-3 py-2"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">From</label>
              <input
                type="time"
                step={60 * 5}
                className="rounded-xl border bg-background px-3 py-2"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                placeholder="09:30"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">To</label>
              <input
                type="time"
                step={60 * 5}
                className="rounded-xl border bg-background px-3 py-2"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                placeholder="10:00"
              />
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Type:</label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="online"
                checked={mode === "online"}
                onChange={() => setMode("online")}
              />
              <span>Virtual</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="in-person"
                checked={mode === "in-person"}
                onChange={() => setMode("in-person")}
              />
              <span>In-Person</span>
            </label>
          </div>

          {mode === "in-person" && (
            <div className="grid gap-1">
              <label className="text-sm font-medium">Place</label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2"
                placeholder="e.g., Lobby, Hall B, Coffee bar"
              />
            </div>
          )}

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
            disabled={loading || !fromTime || !toTime}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function toDateInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function combineLocalDateTimeToISO(dateStr, hhmm) {
  if (!dateStr || !hhmm) return "";
  const [H, M] = hhmm.split(":").map(Number);
  if (Number.isNaN(H) || Number.isNaN(M)) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const local = new Date(y, m - 1, d, H, M, 0, 0);
  return local.toISOString();
}
