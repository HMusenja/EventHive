import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function TicketTier({ ticket, onAdd }) {
    const [qty, setQty] = useState(1);
    const remaining = ticket.quantityTotal - ticket.quantitySold;

    return (
        <Card className="p-4 flex items-center justify-between gap-4">
            <div>
                <h3 className="text-lg font-semibold">{ticket.name}</h3>
                {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
                <p className="mt-1 font-medium">
                    {(ticket.priceCents / 100).toFixed(2)} {ticket.currency?.toUpperCase() || "EUR"} • {remaining} left
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    className="w-20"
                    type="number"
                    min={1}
                    max={Math.min(10, remaining)}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                />
                <Button disabled={remaining <= 0} onClick={() => onAdd(ticket, qty)}>Add</Button>
            </div>
        </Card>
    );
}
