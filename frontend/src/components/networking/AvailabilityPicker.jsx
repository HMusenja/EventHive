import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function genSlots({ start = "09:00", end = "18:00", step = 30 }) {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const slots = [];
    const d = new Date();
    d.setSeconds(0, 0);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    for (let m = startMin; m < endMin; m += step) {
        const s = new Date(d);
        s.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const e = new Date(s); e.setMinutes(e.getMinutes() + step);
        slots.push({ startAt: s, endAt: e, label: s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    }
    return slots;
}

export default function AvailabilityPicker({ onPick, step = 30, dayStart = "09:00", dayEnd = "18:00" }) {
    const slots = useMemo(() => genSlots({ start: dayStart, end: dayEnd, step }), [dayStart, dayEnd, step]);
    const [selected, setSelected] = useState(null);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {slots.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setSelected(s)}
                        className={cn(
                            "rounded border px-2 py-2 text-sm hover:bg-accent",
                            selected === s && "bg-primary text-primary-foreground"
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    disabled={!selected}
                    onClick={() => selected && onPick?.(selected)}
                >
                    Continue
                </Button>
                {selected && (
                    <div className="text-sm text-muted-foreground">
                        Selected: {selected.startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {selected.endAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                )}
            </div>
        </div>
    );
}
