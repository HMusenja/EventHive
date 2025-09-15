import { useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function FeedbackForm() {
    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            setLoading(true);
            await api.post("feedback", { content: text, rating });
            setSuccess(true);
            setText("");
            setRating(5);
        } catch (err) {
            console.error("Failed to send feedback", err);
            alert("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <Card className="my-6 border-primary">
                <CardContent className="p-6 text-center">
                    <p className="font-semibold text-primary">✨ Thank you for your feedback!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="my-6">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Leave Your Feedback</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rating */}
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setRating(n)}
                                className={`p-1 ${n <= rating ? "text-yellow-500" : "text-gray-400"}`}
                            >
                                <Star className="h-5 w-5 fill-current" />
                            </button>
                        ))}
                    </div>

                    {/* Text area */}
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write your feedback…"
                        className="w-full rounded-lg border bg-background px-3 py-2"
                        rows={3}
                    />

                    <Button type="submit" disabled={loading}>
                        {loading ? "Sending…" : "Submit Feedback"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
