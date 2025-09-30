import { useState } from "react";
import { Loader2 } from "lucide-react";
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

export default function DeclineMeetingModal({ open, onClose, meetingId, onDone }) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    const reset = () => setReason("");

    const handleClose = () => {
        reset();
        onClose?.();
    };

    const submit = async () => {
        if (!meetingId || submitting) return;
        try {
            setSubmitting(true);
            const res = await updateMeetingStatus(meetingId, "declined", reason.trim() || undefined);

            // Prefer the server's meeting object; otherwise provide a minimal optimistic one
            const meeting =
                res?.meeting ?? { _id: meetingId, status: "declined", responseNote: reason.trim() || undefined };

            onDone?.(meeting);
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

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
            <DialogContent aria-describedby="decline-desc">
                <DialogHeader>
                    <DialogTitle>Decline meeting</DialogTitle>
                    <DialogDescription id="decline-desc">
                        Add a short note (optional). The requester will be notified.
                    </DialogDescription>
                </DialogHeader>

                <Textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g. I’m double booked — could we try tomorrow morning?"
                />

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Decline
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
