import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AvailabilityPicker from "@/components/networking/AvailabilityPicker";
import { createMeeting } from "@/services/meetingsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function RequestMeeting() {
    const { eventId, userId } = useParams();  // route like /events/:eventId/network/request/:userId
    const [slot, setSlot] = useState(null);
    const [location, setLocation] = useState("in-person");
    const [place, setPlace] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    async function submit() {
        if (!slot) return alert("Pick a time slot");
        try {
            await createMeeting({
                eventId,
                inviteeId: userId,
                startAt: slot.startAt.toISOString(),
                endAt: slot.endAt.toISOString(),
                location,
                place,
                message,
            });
            alert("Meeting request sent!");
            navigate(`/events/${eventId}/networking`);
        } catch (e) {
            alert(e?.response?.data?.message || e.message);
        }
    }

    return (
        <div className="container p-4 space-y-4">
            <h1 className="text-2xl font-semibold">Request a Meeting</h1>

            <label className="text-sm font-medium">Pick a time</label>
            <AvailabilityPicker onPick={setSlot} />

            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium">Location</label>
                    <select className="w-full border rounded px-2 py-2"
                        value={location} onChange={e => setLocation(e.target.value)}>
                        <option value="in-person">In-person</option>
                        <option value="online">Online</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Place / Link</label>
                    <Input value={place} onChange={e => setPlace(e.target.value)} placeholder="Hall B table 7 or https://meet..." />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium">Message (optional)</label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="What would you like to discuss?" />
            </div>

            <Button onClick={submit}>Send Request</Button>
        </div>
    );
}
