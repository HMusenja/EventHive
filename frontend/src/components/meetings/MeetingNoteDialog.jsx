import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";

const SUGGESTIONS = [
    "Could we move this to 14:30? Thanks!",
    "Running a bit late — any chance for tomorrow morning?",
    "Happy to meet, but online works better for me.",
    "Can we shorten to 20 minutes?",
];

export default function MeetingNoteDialog({
    open,
    onClose,
    onSend,             // (text) => Promise|void
    initialValue = "",
    maxLength = 280,
    sending = false,    // show spinner / disable while API in-flight
}) {
    const [text, setText] = useState(initialValue);
    const taRef = useRef(null);

    // reset + autofocus whenever the dialog opens
    useEffect(() => {
        if (open) {
            setText(initialValue);
            // allow content mount
            setTimeout(() => taRef.current?.focus(), 10);
        }
    }, [open, initialValue]);

    const count = text.length;
    const trimmed = text.trim();
    const canSend = trimmed.length > 0 && count <= maxLength && !sending;

    function pickSuggestion(s) {
        setText(s);
        // re-focus so user can keep typing
        taRef.current?.focus();
    }

    function handleSend() {
        if (!canSend) return;
        onSend?.(trimmed);
    }

    // Cmd/Ctrl+Enter to send
    function onKeyDown(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? onClose?.() : null)}>
            <DialogContent className="sm:max-w-lg" aria-describedby="meeting-note-desc">
                <DialogHeader className="pb-2">
                    <DialogTitle>Send a quick message</DialogTitle>
                    <DialogDescription id="meeting-note-desc">
                        Ask to change the time or leave a short note for the other participant.
                    </DialogDescription>
                </DialogHeader>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => pickSuggestion(s)}
                            className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Message box */}
                <div className="grid gap-2 pt-2">
                    <label className="text-sm font-medium" htmlFor="meeting-note-ta">Message</label>
                    <Textarea
                        id="meeting-note-ta"
                        ref={taRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={onKeyDown}
                        rows={5}
                        maxLength={maxLength}
                        placeholder="Be clear and kind. You can suggest a new time."
                        className="rounded-xl"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Be clear and kind. You can suggest a new time.</span>
                        <span className={count > maxLength ? "text-red-600" : ""}>
                            {count} / {maxLength}
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={onClose} disabled={sending}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSend}
                        disabled={!canSend}
                        className="min-w-[96px]"
                    >
                        {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
