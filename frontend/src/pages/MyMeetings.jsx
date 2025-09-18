// frontend/src/pages/MyMeetings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listMeetings, updateMeetingStatus } from "@/services/meetingsApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, Video, MapPin, Check, X, Ban, Filter, Pencil } from "lucide-react";

function fmtRange(startAt, endAt) {
    const s = new Date(startAt);
    const e = new Date(endAt);
    const sameDay = s.toDateString() === e.toDateString();
    const date = s.toLocaleDateString([], { dateStyle: "medium" });
    const t1 = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const t2 = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return sameDay ? `${date} • ${t1} – ${t2}` : `${date} ${t1} → ${e.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
}

export default function MyMeetings() {
    const { eventId } = useParams();
    const { toast } = useToast();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState(null);
    const [viewMode, setViewMode] = useState("upcoming"); // upcoming | past | today | all

    async function load(signal) {
        setLoading(true);
        try {
            const params = { role: "mine" };
            if (eventId) params.eventId = eventId; // guard event filter
            const { meetings } = await listMeetings({ ...params, signal });
            setItems(meetings || []);
        } catch (err) {
            console.error(err);
            toast({ title: "Could not load meetings", description: "Showing what we can.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const ctrl = new AbortController();
        load(ctrl.signal);
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    async function act(id, status) {
        setActingId(id);
        const prev = items;
        setItems(prev.map(m => (m._id === id ? { ...m, status } : m)));
        try {
            await updateMeetingStatus(id, status);
            toast({ title: "Updated", description: `Meeting ${status}.` });
        } catch (err) {
            setItems(prev);
            toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
        } finally {
            setActingId(null);
        }
    }

    const scheduleTo = eventId ? `/events/${eventId}/people` : `/people`;

    // stats
    const counts = useMemo(() => {
        const now = new Date();
        const total = items.length;
        const upcoming = items.filter(m => new Date(m.startAt) >= now).length;
        const virtual = items.filter(m => (m.location || "").match(/zoom|meet|teams/i)).length;
        const inPerson = Math.max(0, total - virtual);
        return { total, upcoming, virtual, inPerson };
    }, [items]);

    // filter
    const filtered = useMemo(() => {
        const now = new Date();
        if (viewMode === "all") return items;
        if (viewMode === "today") return items.filter(m => new Date(m.startAt).toDateString() === now.toDateString());
        if (viewMode === "past") return items.filter(m => new Date(m.startAt) < now);
        return items.filter(m => new Date(m.startAt) >= now); // upcoming
    }, [items, viewMode]);

    return (
        <div className="min-h-screen flex flex-col"> {/* ✅ full viewport height */}
            <div className="space-y-6 flex-1">          {/* let content stretch */}
                {/* Header + single CTA */}
                <div className="flex items-baseline justify-between">
                    <h1 className="text-2xl font-semibold">My Meetings</h1>
                    <Button asChild className="rounded-xl px-3">
                        <Link to={scheduleTo}>Schedule New Meeting</Link>
                    </Button>
                </div>
                {eventId && <div className="text-sm text-muted-foreground -mt-3">Event filter: {eventId}</div>}

                {/* Filters + Stats */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <Select value={viewMode} onValueChange={setViewMode}>
                        <SelectTrigger className="w-56">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="past">Past Meetings</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="all">All Meetings</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 w-full sm:w-auto">
                        <Stat number={counts.total} label="Total" icon={<Calendar className="h-4 w-4 text-white" />} bg="bg-blue-500" />
                        <Stat number={counts.upcoming} label="Upcoming" icon={<Clock className="h-4 w-4 text-white" />} bg="bg-green-500" />
                        <Stat number={counts.virtual} label="Virtual" icon={<Video className="h-4 w-4 text-white" />} bg="bg-purple-500" />
                        <Stat number={counts.inPerson} label="In-Person" icon={<MapPin className="h-4 w-4 text-white" />} bg="bg-orange-500" />
                    </div>
                </div>

                {/* List (fills space; empty state still centered) */}
                {loading ? (
                    <div className="mt-10 flex items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading meetings…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No meetings found</h3>
                        <p className="text-muted-foreground mb-4">
                            {viewMode === "upcoming" ? "You don't have any upcoming meetings." : "No meetings match your current filter."}
                        </p>
                        <Button asChild className="bg-gradient-to-r from-primary to-secondary">
                            <Link to={scheduleTo}>Schedule Your First Meeting</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered
                            .slice()
                            .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
                            .map(m => (
                                <Card key={m._id}>
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-medium">{fmtRange(m.startAt, m.endAt)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Status: <Badge variant="secondary" className="ml-1">{m.status}</Badge>
                                                {m.location ? <> • Location: {m.location}</> : null}
                                                {m.place ? <> • {m.place}</> : null}
                                            </div>
                                            {m.message && <div className="mt-1 text-sm">{m.message}</div>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Edit = navigate to people to (re)schedule with host; simple MVP */}
                                            <Button asChild variant="outline" size="sm">
                                                <Link to={scheduleTo}><Pencil className="mr-1 h-4 w-4" /> Edit</Link>
                                            </Button>

                                            {m.status === "pending" && (
                                                <>
                                                    <Button size="sm" onClick={() => act(m._id, "accepted")} disabled={actingId === m._id}>
                                                        {actingId === m._id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                                                        Accept
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => act(m._id, "declined")} disabled={actingId === m._id}>
                                                        <X className="mr-1 h-4 w-4" /> Decline
                                                    </Button>
                                                </>
                                            )}
                                            {m.status !== "cancelled" && (
                                                <Button size="sm" variant="destructive" onClick={() => act(m._id, "cancelled")} disabled={actingId === m._id}>
                                                    <Ban className="mr-1 h-4 w-4" /> Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ number, label, icon, bg }) {
    return (
        <Card>
            <CardContent className="p-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
                    <div>
                        <div className="text-xs opacity-80">{label}</div>
                        <div className="text-lg font-semibold">{number}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
