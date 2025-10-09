import { useMemo, useState } from "react";
import { Loader2, X, Calendar, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateMeetingStatus } from "@/api/meetingsApi";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils"; // if you have shadcn's cn; otherwise remove and inline classes

const QUICK_REASONS = [
    "Time conflict",
    "Fully booked this week",
    "Prefer async first",
    "Not a fit right now",
];

export default function DeclineMeetingModal({
    open,
    onClose,
    meetingId,
    onDone,    // (meeting) => void
    onPropose, // () => void
}) {
    const { toast } = useToast();
    const [selected, setSelected] = useState([]);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const composedNote = useMemo(() => {
        const head = selected.join("; ");
        const tail = note.trim();
        if (head && tail) return `${head}. ${tail}`;
        if (head) return head;
        return tail;
    }, [selected, note]);

    const toggleReason = (r) =>
        setSelected((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

    const handleClose = () => {
        setSelected([]);
        setNote("");
        onClose?.();
    };

    const decline = async (extraNote) => {
        if (!meetingId) return;
        try {
            setSubmitting(true);
            const finalNote = extraNote ?? (composedNote || undefined);
            const res = await updateMeetingStatus(meetingId, "declined", finalNote);
            const meeting = res?.meeting;
            if (meeting) onDone?.(meeting);
            toast({ title: "Declined", description: "The requester has been notified." });
            handleClose();
        } catch (e) {
            toast({
                title: "Couldn’t decline",
                description: e?.response?.data?.message || e?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const declineAsyncChat = () =>
        decline(
            composedNote
                ? `${composedNote} — happy to start with a quick async chat instead.`
                : "Happy to start with a quick async chat instead."
        );

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
            <DialogContent
                aria-describedby="decline-desc"
                className="sm:max-w-[640px] rounded-2xl border bg-background/95 backdrop-blur p-6 shadow-xl gap-5"
            >
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">
                        Decline meeting
                    </DialogTitle>
                    <DialogDescription id="decline-desc" className="text-base">
                        Choose a quick reason (optional), add a note, or propose a new time.
                    </DialogDescription>
                </DialogHeader>

                {/* Quick reasons */}
                <div className="flex flex-wrap gap-2">
                    {QUICK_REASONS.map((r) => {
                        const active = selected.includes(r);
                        return (
                            <button
                                key={r}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleReason(r)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm transition",
                                    "border",
                                    active
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-muted/60 hover:bg-muted border-transparent"
                                )}
                            >
                                {r}
                            </button>
                        );
                    })}
                </div>

                {/* Freeform note */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="decline-note">
                        Note (optional)
                    </label>
                    <Textarea
                        id="decline-note"
                        rows={5}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g., I’m double booked this week — could we try next Tuesday morning?"
                        className="min-h-[120px] rounded-xl border bg-background focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                </div>

                <DialogFooter
                    // Split actions across: secondary group left, primary group right
                    className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 border-t"
                >
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={declineAsyncChat}
                            disabled={submitting}
                            title="Decline now but suggest chatting via messages first"
                            className="inline-flex items-center gap-2 rounded-xl"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Suggest async chat
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        {typeof onPropose === "function" && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleClose();
                                    onPropose();
                                }}
                                disabled={submitting}
                                title="Pick another time instead of declining"
                                className="inline-flex items-center gap-2 rounded-xl"
                            >
                                <Calendar className="h-4 w-4" />
                                Propose new time
                            </Button>
                        )}

                        <Button
                            onClick={() => decline()}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            Decline
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
