import { useState } from "react";
import RequestMeetingModal from "./RequestMeetingModal";
import { CalendarPlus } from "lucide-react";

/** Usage:
 *  <RequestMeetingButton hostId={attendee._id} eventId={eventId} />
 */
export default function RequestMeetingButton({ hostId, eventId, label = "Request meeting" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <CalendarPlus className="h-4 w-4" />
        {label}
      </button>
      <RequestMeetingModal open={open} onClose={() => setOpen(false)} hostId={hostId} eventId={eventId} />
    </>
  );
}