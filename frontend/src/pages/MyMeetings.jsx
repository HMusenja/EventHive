import { useEffect, useState } from "react";
import { listMeetings, updateMeetingStatus } from "@/services/meetingsApi";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";

export default function MyMeetings() {
    const { eventId } = useParams();
    const [items, setItems] = useState([]);

    async function load() {
        const { meetings } = await listMeetings({ eventId, role: "mine" });
        setItems(meetings);
    }
    useEffect(() => { load(); }, [eventId]);

    async function act(id, status) {
        await updateMeetingStatus(id, status);
        await load();
    }

    return (
        <div className="container p-4 space-y-4">
            <h1 className="text-2xl font-semibold">My Meetings</h1>
            {items.map(m => (
                <div key={m._id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                        <div className="font-medium">{new Date(m.startAt).toLocaleString()} – {new Date(m.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-sm text-muted-foreground">Status: {m.status} • Location: {m.location} {m.place && `• ${m.place}`}</div>
                    </div>
                    <div className="flex gap-2">
                        {m.status === "pending" && (
                            <>
                                <Button size="sm" onClick={() => act(m._id, "accepted")}>Accept</Button>
                                <Button size="sm" variant="outline" onClick={() => act(m._id, "declined")}>Decline</Button>
                            </>
                        )}
                        {m.status !== "cancelled" && (
                            <Button size="sm" variant="destructive" onClick={() => act(m._id, "cancelled")}>Cancel</Button>
                        )}
                    </div>
                </div>
            ))}
            {items.length === 0 && <p className="text-muted-foreground">No meetings yet.</p>}
        </div>
    );
}
