import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { User as UserIcon, Loader2, Calendar, Clock, Video, MapPin, Check, X, Ban, Filter, MessageSquare } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ScheduleMeetingModal from "@/components/meetings/ScheduleMeetingModal";
import MeetingNoteDialog from "@/components/meetings/MeetingNoteDialog";
import DeclineMeetingModal from "@/components/meetings/DeclineMeetingModal";

import { listMeetings, updateMeetingStatus, sendMeetingNote } from "@/api/meetingsApi";

/* -------------------------- helpers -------------------------- */

const str = (v) => (v == null ? "" : String(v));
const idOf = (objOrId) => {
    if (!objOrId) return "";
    if (typeof objOrId === "object") return str(objOrId._id ?? objOrId.id ?? "");
    return str(objOrId);
};
const myIdFromAuth = (user) => str(user?._id || "");

const otherParticipantId = (m, myId) => {
    const requesterId = idOf(m.requesterId ?? m.requester?._id);
    const inviteeId = idOf(m.inviteeId ?? m.invitee?._id);
    return requesterId === myId ? inviteeId : requesterId;
};

const counterpartOf = (m, myId) => {
    const requester = m.requester || m.requesterUser || {};
    const invitee = m.invitee || m.inviteeUser || {};

    const amRequester = idOf(m.requesterId ?? requester._id) === myId;
    const other = amRequester ? invitee : requester;

    const id = idOf(other._id || (amRequester ? m.inviteeId : m.requesterId));
    const explicitName =
        other.fullName ||
        other.name ||
        other.username ||
        m.counterpartName ||
        (amRequester ? m.inviteeName : m.requesterName) ||
        null;

    return {
        id: id || null,
        shortId: id ? id.slice(-6) : null,
        name: explicitName || null,
        hasRealName: Boolean(explicitName),
        avatar: other.avatarUrl || other.photo || other.avatar || null,
    };
};

function fmtRange(startAt, endAt) {
    const s = new Date(startAt);
    const e = new Date(endAt);
    const sameDay = s.toDateString() === e.toDateString();
    const date = s.toLocaleDateString([], { dateStyle: "medium" });
    const t1 = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const t2 = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return sameDay
        ? `${date} • ${t1} – ${t2}`
        : `${date} ${t1} → ${e.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
}

/* -------------------------- component -------------------------- */

export default function MyMeetings() {
    const { eventId } = useParams();
    const { toast } = useToast();
    const { user } = useAuth();
    const myId = myIdFromAuth(user);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState(null);

    // quick note dialog
    const [noteForId, setNoteForId] = useState(null);
    const [noteSending, setNoteSending] = useState(false);

    // list filters
    const [viewMode, setViewMode] = useState("upcoming");

    // schedule modal (used for “propose new time” or CTA)
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [presetInviteeId, setPresetInviteeId] = useState(null);

    // decline modal (single instance)
    const [declineOpen, setDeclineOpen] = useState(false);
    const [declineId, setDeclineId] = useState(null);

    function openDecline(m) {
        setDeclineId(m._id);
        setDeclineOpen(true);
    }

    async function load(signal) {
        setLoading(true);
        try {
            const params = { role: "mine", ...(eventId ? { eventId } : {}) };
            const { meetings } = await listMeetings(params, { signal });
            setItems(meetings || []);
        } catch (err) {
            if (err?.code !== "ERR_CANCELED") {
                console.error(err);
                toast({
                    title: "Could not load meetings",
                    description: "Showing what we can.",
                    variant: "destructive",
                });
            }
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

    function showError(err) {
        const code = err?.response?.status;
        const data = err?.response?.data;
        const fallback = data?.message || err?.message || "Action failed";

        if (code === 409) {
            if (data?.conflict) {
                const who = data.offender === "requester" ? "the requester" : "you";
                const s = new Date(data.conflict.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
                const e = new Date(data.conflict.endAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
                toast({
                    title: "Time slot not available",
                    description: `${who} already has a meeting from ${s} to ${e}. Please pick a different time.`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Time slot not available",
                    description: "This overlaps another meeting. Please choose a different time.",
                    variant: "destructive",
                });
            }
            return;
        }

        if (code === 401) {
            toast({
                title: "You’re signed out",
                description: "Please log in again to continue.",
                variant: "destructive",
            });
            return;
        }

        toast({ title: "Error", description: fallback, variant: "destructive" });
    }

    function mutateLocal(updated) {
        if (!updated?._id) return;
        setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
        toast({ title: "Updated", description: `Status: ${updated.status}` });
    }

    async function refresh() {
        try {
            const params = { role: "mine", ...(eventId ? { eventId } : {}) };
            const { meetings } = await listMeetings(params);
            setItems(meetings || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function acceptMeeting(m) {
        setActingId(m._id);
        try {
            const res = await updateMeetingStatus(m._id, "accepted");
            const meeting = res?.meeting;
            if (meeting) mutateLocal(meeting);
        } catch (e) {
            showError(e);
            if (e?.response?.status === 409) await refresh();
        } finally {
            setActingId(null);
        }
    }

    function proposeNewTime(m) {
        const otherId = otherParticipantId(m, myId);
        if (!otherId) return;
        setPresetInviteeId(otherId);
        setScheduleOpen(true);
    }

    async function removeMeeting(m) {
        setActingId(m._id);
        try {
            await updateMeetingStatus(m._id, "cancelled");
            setItems((prev) => prev.filter((x) => x._id !== m._id)); // UI updates immediately
            toast({ title: "Removed", description: "The meeting was removed from your list." });
        } catch (e) {
            showError(e);
        } finally {
            setActingId(null);
        }
    }

    async function handleSendNote(text) {
        if (!noteForId) return;
        setNoteSending(true);
        try {
            const { meeting } = await sendMeetingNote(noteForId, text);
            if (meeting) {
                mutateLocal(meeting);
                toast({ title: "Message sent", description: "Your note was attached to the meeting." });
            }
        } catch (e) {
            showError(e);
        } finally {
            setNoteSending(false);
            setNoteForId(null);
        }
    }

    // Stats (Total ignores cancelled, so it matches the visible list)
    const counts = useMemo(() => {
        const now = new Date();
        const base = items.filter((m) => m.status !== "cancelled");
        const active = base.filter((m) => m.status === "pending" || m.status === "accepted");

        const total = base.length;
        const upcoming = active.filter((m) => new Date(m.endAt) >= now).length;

        const isVirtual = (m) => {
            const loc = (m.location || "").toLowerCase();
            const place = m.place || "";
            return loc === "online" || /(zoom|meet|teams|skype|webex|http:\/\/|https:\/\/)/i.test(place);
        };

        const virtual = active.filter(isVirtual).length;
        const inPerson = active.filter((m) => (m.location || "").toLowerCase() === "in-person").length;

        return { total, upcoming, virtual, inPerson };
    }, [items]);

    const filtered = useMemo(() => {
        const now = new Date();
        const base = items.filter((m) => m.status !== "cancelled");
        if (viewMode === "all") return base;
        if (viewMode === "today") {
            const today = now.toDateString();
            return base.filter((m) => new Date(m.startAt).toDateString() === today);
        }
        if (viewMode === "past") return base.filter((m) => new Date(m.endAt) < now);
        return base.filter((m) => new Date(m.endAt) >= now);
    }, [items, viewMode]);

    return (
        <div className="min-h-screen flex flex-col">
            <div className="space-y-6 flex-1">
                {/* Header + CTA */}
                <div className="flex items-baseline justify-between">
                    <h1 className="text-2xl font-semibold">My Meetings</h1>
                    <Button className="rounded-xl px-3" onClick={() => setScheduleOpen(true)}>
                        Schedule New Meeting
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

                {/* List */}
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
                        <Button className="bg-gradient-to-r from-primary to-secondary" onClick={() => setScheduleOpen(true)}>
                            Schedule Your First Meeting
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered
                            .slice()
                            .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
                            .map((m) => {
                                const isInvitee = idOf(m.inviteeId) === myId;
                                const isRequester = idOf(m.requesterId) === myId;
                                const isPending = m.status === "pending";
                                const counterpart = counterpartOf(m, myId);

                                return (
                                    <Card
                                        key={m._id}
                                        className={
                                            m.status === "declined"
                                                ? "border-amber-300/60 shadow-[inset_4px_0_0_0_rgba(245,158,11,0.6)]"
                                                : ""
                                        }
                                    >
                                        <CardContent className="p-4 flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="font-medium">{fmtRange(m.startAt, m.endAt)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Status: <Badge variant="secondary" className="ml-1">{m.status}</Badge>
                                                    {m.location ? <> • Location: {m.location}</> : null}
                                                    {m.place ? <> • {m.place}</> : null}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    {counterpart.avatar ? (
                                                        <img
                                                            src={counterpart.avatar}
                                                            alt={counterpart.name || "User"}
                                                            className="h-5 w-5 rounded-full border"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="h-5 w-5 rounded-full border grid place-items-center">
                                                            <UserIcon className="h-3.5 w-3.5 opacity-70" />
                                                        </div>
                                                    )}

                                                    {(counterpart.hasRealName || counterpart.shortId) && (
                                                        <span className="flex items-center gap-1">
                                                            With:
                                                            {counterpart.hasRealName ? (
                                                                <span className="font-medium text-foreground">{counterpart.name}</span>
                                                            ) : (
                                                                <>
                                                                    <span className="font-medium text-foreground">User</span>
                                                                    {counterpart.shortId && (
                                                                        <span
                                                                            title={counterpart.id ? `User ID: ${counterpart.id}` : undefined}
                                                                            className="ml-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                                                        >
                                                                            {counterpart.shortId}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {isInvitee && m.status === "declined" && (
                                                    <div className="mt-1">
                                                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                                                            You declined
                                                            {m.updatedAt
                                                                ? ` • ${new Date(m.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
                                                                : ""}
                                                        </Badge>
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            The requester has been notified.
                                                        </span>
                                                    </div>
                                                )}

                                                {m.message && <div className="mt-1 text-sm">{m.message}</div>}
                                                {m.responseNote && (
                                                    <div className="mt-1 text-xs text-muted-foreground">Note: {m.responseNote}</div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Send a quick message"
                                                    onClick={() => setNoteForId(m._id)}
                                                    disabled={actingId === m._id}
                                                >
                                                    <MessageSquare className="mr-1 h-4 w-4" /> Message
                                                </Button>

                                                {isInvitee && isPending && (
                                                    <>
                                                        <Button size="sm" onClick={() => acceptMeeting(m)} disabled={actingId === m._id}>
                                                            {actingId === m._id ? (
                                                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Check className="mr-1 h-4 w-4" />
                                                            )}
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openDecline(m)}
                                                            disabled={actingId === m._id}
                                                        >
                                                            <X className="mr-1 h-4 w-4" /> Decline
                                                        </Button>
                                                    </>
                                                )}

                                                {isInvitee && m.status === "declined" && (
                                                    <Button size="sm" onClick={() => proposeNewTime(m)}>
                                                        <Calendar className="mr-1 h-4 w-4" /> Propose New Time
                                                    </Button>
                                                )}

                                                {(isRequester || isInvitee) && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => removeMeeting(m)}
                                                        disabled={actingId === m._id}
                                                    >
                                                        <Ban className="mr-1 h-4 w-4" /> Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Quick message dialog */}
            <MeetingNoteDialog
                open={Boolean(noteForId)}
                onClose={() => setNoteForId(null)}
                onSend={handleSendNote}
                sending={noteSending}
            />

            {/* Decline modal – single instance */}
            <DeclineMeetingModal
                open={declineOpen}
                meetingId={declineId}
                onClose={() => { setDeclineOpen(false); setDeclineId(null); }}
                onDone={(meeting) => mutateLocal?.(meeting)}
                onPropose={() => {
                    const m = items.find((x) => x._id === declineId);
                    if (m) proposeNewTime(m);
                }}
            />

            {/* Schedule modal */}
            <ScheduleMeetingModal
                isOpen={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                eventId={eventId || undefined}
                presetInviteeId={presetInviteeId || null}
            />
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
