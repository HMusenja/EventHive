import { useEffect, useMemo, useState } from "react";
import { addMinutes, startOfDay, endOfDay } from "./date-utils";
import { Loader2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/axios";

/**
 * AvailabilityPicker
 * Props:
 *  - hostId: string (the attendee you're trying to meet)
 *  - date: Date (controlled), onDateChange: fn(Date)
 *  - slotMinutes: number (default 30)
 *  - workingHours: { start: string, end: string } e.g. {start:"09:00", end:"17:00"}
 *  - onSelect(slot: { startAt: ISO, endAt: ISO })
 */
export default function AvailabilityPicker({
  hostId,
  date,
  onDateChange,
  slotMinutes = 30,
  workingHours = { start: "09:00", end: "17:00" },
  onSelect,
}) {
  const [busy, setBusy] = useState([]); // [{start,end} ISO]
  const [loading, setLoading] = useState(false);
  const dayStart = useMemo(() => startOfDay(date), [date]);
  const dayEnd = useMemo(() => endOfDay(date), [date]);

  useEffect(() => {
    if (!hostId || !date) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const params = {
          userId: hostId,
          from: dayStart.toISOString(),
          to: dayEnd.toISOString(),
          slot: slotMinutes,
        };
        const { data } = await api.get("/availability", { params });
        if (!alive) return;
        setBusy(Array.isArray(data?.busy) ? data.busy : []);
      } catch (e) {
        // Fallback: no busy slots (all free). You can refine once BE is ready
        if (alive) setBusy([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [hostId, dayStart, dayEnd, slotMinutes]);

  const slots = useMemo(() => {
    // Build slots from working hours
    // workingHours.start/end are "HH:MM"
    const [sh, sm] = String(workingHours.start).split(":").map(Number);
    const [eh, em] = String(workingHours.end).split(":").map(Number);
    const start = new Date(dayStart); start.setHours(sh, sm, 0, 0);
    const end = new Date(dayStart); end.setHours(eh, em, 0, 0);

    const arr = [];
    let cur = start;
    while (cur < end) {
      const next = addMinutes(cur, slotMinutes);
      if (next > end) break;
      arr.push({ startAt: cur.toISOString(), endAt: next.toISOString() });
      cur = next;
    }
    return arr;
  }, [dayStart, slotMinutes, workingHours]);

  const isBusy = (slot) => {
    const s = new Date(slot.startAt).getTime();
    const e = new Date(slot.endAt).getTime();
    return busy.some((b) => {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      return s < be && e > bs; // overlap
    });
  };

  const prevDay = () => onDateChange(new Date(dayStart.getTime() - 86400000));
  const nextDay = () => onDateChange(new Date(dayStart.getTime() + 86400000));

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{dayStart.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="rounded-lg border px-2 py-1 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextDay} className="rounded-lg border px-2 py-1 hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading availability…
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const disabled = isBusy(slot);
            const label = new Date(slot.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <button
                key={slot.startAt}
                disabled={disabled}
                onClick={() => onSelect?.(slot)}
                className={`rounded-xl border px-3 py-2 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"}`}
                title={`${label}`}
              >
                {label}
              </button>
            );
          })}
          {slots.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">No working hours configured for this day.</div>
          )}
        </div>
      </div>
    </div>
  );
}