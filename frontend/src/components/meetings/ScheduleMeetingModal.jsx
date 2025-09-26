import { useEffect, useMemo, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MAX = 280;

// Small, tasteful presets to speed people up
const SUGGESTIONS = [
    "Could we move this to 14:30? Thanks!",
    "Running tight—any chance for tomorrow morning?",
    "Happy to meet, but online works better for me.",
    "Can we shorten to 20 minutes?",
];

/**
 * MeetingNoteDialog
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open:boolean) => void
 *  - onSend: (text:string) => Promise<void> | void
 *  - loading?: boolean
 *  - defaultText?: string
 */
export default function MeetingNoteDialog({
    open,
    onOpenChange,
    onSend,
    loading = false,
    defaultText = "",
}) {
    const [text, setText] = useState(defaultText);
    const taRef = useRef(null);

    useEffect(() => {
        if (open) {
            setText(defaultText || "");
            // autofocus after Radix mounts
            setTimeout(() => taRef.current?.focus(), 30);
        }
    }, [open, defaultText]);

    const remaining = MAX - (text?.length || 0);
    const over = remaining < 0;
    const canSend = !loading && !!text.trim() && !over;

    // Cmd/Ctrl + Enter to send
    function onKeyDown(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSend) {
            e.preventDefault();
            submit();
        }
    }

    async function submit(e) {
        e?.preventDefault?.();
        if (!canSend) return;
        await onSend?.(text.trim());
    }

    function addSuggestion(s) {
        if (!s) return;
        setText((prev) => (prev ? `${prev}\n${s}` : s));
        setTimeout(() => taRef.current?.focus(), 0);
    }

    const helper = useMemo(() => {
        if (over) return `Too long by ${Math.abs(remaining)} characters`;
        if (!text.trim()) return "Be clear and kind. You can suggest a new time.";
        return "Press ⌘/Ctrl + Enter to send";
    }, [over, remaining, text]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
                <form onSubmit={submit}>
                    <DialogHeader className="px-5 pt-5 pb-2">
                        <DialogTitle className="text-xl">Send a quick message</DialogTitle>
                        <DialogDescription className="text-sm">
                            Ask to change the time or leave a short note for the other participant.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Suggestions */}
                    <div className="px-5 pt-2 pb-1 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                type="button"
                                key={i}
                                onClick={() => addSuggestion(s)}
                                className="text-xs rounded-full border px-3 py-1 hover:bg-accent transition"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="px-5 pt-3 pb-2 grid gap-2">
                        <Label htmlFor="note" className="text-sm font-medium">
                            Message
                        </Label>
                        <Textarea
                            ref={taRef}
                            id="note"
                            rows={5}
                            maxLength={MAX + 50} // allow typing past limit but show error
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Could we move this to 14:30? Thanks!"
                            className="resize-y"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className={over ? "text-red-600" : ""}>{helper}</span>
                            <span aria-live="polite">
                                {Math.max(0, remaining)} / {MAX}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="px-5 pb-5 pt-2 gap-2 sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={!canSend}>
                            {loading ? "Sending…" : "Send"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
