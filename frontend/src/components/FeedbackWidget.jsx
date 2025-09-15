import { useState } from "react";
import { MessageSquare } from "lucide-react";
import FeedbackForm from "@/components/FeedbackForm";

export default function FeedbackWidget() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-white shadow-lg hover:scale-105 transition"
            >
                <MessageSquare className="h-5 w-5" />
                <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-xl shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                        >
                            ✕
                        </button>
                        <FeedbackForm />
                    </div>
                </div>
            )}
        </>
    );
}
