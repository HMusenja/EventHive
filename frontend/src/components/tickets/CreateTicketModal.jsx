// src/components/tickets/CreateTicketsModal.jsx
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOrganizerTickets } from "@/context/OrganizerTicketContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Trash2, CopyPlus, Plus } from "lucide-react";

const itemSchema = z
  .object({
    title: z.string().min(2, "Title is required"),
    type: z.enum(["free", "paid"]),
    price: z.number().min(0),
    currency: z.string().min(3),
    unlimited: z.boolean().default(false),
    quantityTotal: z.number().int().min(0).nullable(),
    showRemaining: z.boolean().default(false),
    minPerOrder: z.number().int().min(1).default(1),
    maxPerOrder: z.number().int().min(1).default(10),
    salesStartAt: z.string().optional(),
    salesEndAt: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    refundPolicy: z.string().optional(),
    requiresApproval: z.boolean().default(false),
    feesIncluded: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine(
    (v) => v.unlimited || (v.quantityTotal !== null && v.quantityTotal >= 1),
    { path: ["quantityTotal"], message: "Enter at least 1 when not unlimited" }
  );

function toNumber(val, fb = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fb;
}

function newItem(nowLocal, eventEndLocal = "") {
  return {
    title: "",
    type: "free",
    price: 0,
    currency: "EUR",
    unlimited: false,
    quantityTotal: 0,
    showRemaining: false,
    minPerOrder: 1,
    maxPerOrder: 10,
    salesStartAt: nowLocal,
    salesEndAt: eventEndLocal || "",
    category: "",
    description: "",
    refundPolicy: "",
    requiresApproval: false,
    feesIncluded: false,
    isActive: true,
  };
}

export default function CreateTicketsModal({
  open,
  onOpenChange,
  eventId,
  eventEndAt,
  onDone, // optional callback after success
}) {
  const { create } = useOrganizerTickets();

  const nowLocal = useMemo(() => new Date().toISOString().slice(0, 16), []);
  const eventEndLocal = useMemo(
    () => (eventEndAt ? new Date(eventEndAt).toISOString().slice(0, 16) : ""),
    [eventEndAt]
  );

  const [items, setItems] = useState([newItem(nowLocal, eventEndLocal)]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setItems([newItem(nowLocal, eventEndLocal)]);
      setErrors({});
    }
  }, [open, nowLocal, eventEndLocal]);

  const setVal = (idx, key, value) =>
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });

  const removeAt = (idx) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const duplicateAt = (idx) =>
    setItems((prev) => {
      const copy = { ...prev[idx], title: `${prev[idx].title} (copy)` };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });

  const addBlank = () =>
    setItems((prev) => [...prev, newItem(nowLocal, eventEndLocal)]);

  const validateAll = () => {
    const perItemErrors = {};
    const parsedItems = [];

    items.forEach((raw, idx) => {
      const normalized = {
        ...raw,
        price: raw.type === "free" ? 0 : Number(Number(raw.price).toFixed(2)),
        quantityTotal: raw.unlimited ? null : toNumber(raw.quantityTotal, 0),
        minPerOrder: toNumber(raw.minPerOrder, 1),
        maxPerOrder: toNumber(raw.maxPerOrder, 10),
      };

      // extra checks
      const start = raw.salesStartAt ? new Date(raw.salesStartAt) : null;
      const end = raw.salesEndAt ? new Date(raw.salesEndAt) : null;
      const errs = {};

      const parsed = itemSchema.safeParse(normalized);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errs[issue.path.join(".")] = issue.message;
        }
      }
      if (start && end && start > end) {
        errs.salesEndAt = "End must be after start";
      }
      if (normalized.maxPerOrder < normalized.minPerOrder) {
        errs.maxPerOrder = "Max must be >= Min";
      }

      if (Object.keys(errs).length) {
        perItemErrors[idx] = errs;
      } else {
        parsedItems.push({ idx, data: parsed.success ? parsed.data : normalized });
      }
    });

    setErrors(perItemErrors);
    return { ok: Object.keys(perItemErrors).length === 0, parsedItems };
  };

  const buildPayload = (data) => {
    const toInt = (n, fb) => {
      const v = Number(n);
      return Number.isFinite(v) ? Math.trunc(v) : fb;
    };
    const toMoneyCents = (n) => {
      const v = Number(n);
      return Number.isFinite(v) ? Math.round(v * 100) : 0;
    };
    const isoOrUndef = (v) => (v ? new Date(v).toISOString() : undefined);
    const stripUndef = (obj) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

    const isPaid = data.type === "paid";
    return stripUndef({
      name: data.title,
      title: data.title,
      priceCents: isPaid ? toMoneyCents(data.price) : 0,
      currency: isPaid ? String(data.currency || "EUR").toUpperCase() : undefined,
      unlimited: !!data.unlimited,
      quantityTotal: data.unlimited ? undefined : toInt(data.quantityTotal, 1),
      showRemaining: !!data.showRemaining,
      minPerOrder: toInt(data.minPerOrder, 1),
      maxPerOrder: toInt(data.maxPerOrder, 10),
      salesStartAt: isoOrUndef(data.salesStartAt),
      salesEndAt: isoOrUndef(data.salesEndAt),
      category: data.category || undefined,
      description: data.description || undefined,
      refundPolicy: data.refundPolicy || undefined,
      requiresApproval: !!data.requiresApproval,
      feesIncluded: !!data.feesIncluded,
      isActive: !!data.isActive,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) {
      toast.error("Missing eventId");
      return;
    }
    const { ok, parsedItems } = validateAll();
    if (!ok) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    setSubmitting(true);
    let createdCount = 0;
    try {
      for (const { data, idx } of parsedItems) {
        const payload = buildPayload(data);
        // sequential to keep order + clearer error toast
        const res = await create(eventId, payload);
        if (res?._id) {
          createdCount += 1;
        }
      }
      if (createdCount > 0) {
        toast.success(`Created ${createdCount} ticket${createdCount > 1 ? "s" : ""} successfully`);
        onOpenChange(false);
        onDone?.();
      } else {
        toast.message("No tickets were created.");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to create tickets");
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ idx, name }) =>
    errors[idx]?.[name] ? (
      <p className="text-sm text-destructive mt-1">{errors[idx][name]}</p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => submitting && e.preventDefault()}
        onEscapeKeyDown={(e) => submitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Tickets</DialogTitle>
          <DialogDescription>
            Add one or more ticket types. You can set quantities, pricing, and limits for each.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header row actions */}
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <Badge variant="secondary">{items.length} ticket form(s)</Badge>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addBlank}>
                <Plus className="h-4 w-4 mr-1" />
                Add Ticket
              </Button>
            </div>
          </div>

          {items.map((it, idx) => (
            <Card key={idx} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ticket #{idx + 1}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateAt(idx)}
                  >
                    <CopyPlus className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAt(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={it.title}
                    onChange={(e) => setVal(idx, "title", e.target.value)}
                  />
                  <FieldError idx={idx} name="title" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={it.type}
                      onValueChange={(v) => setVal(idx, "type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price {it.type === "free" ? "(€0.00)" : ""}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={it.type === "free"}
                      value={it.type === "free" ? 0 : it.price}
                      onChange={(e) => setVal(idx, "price", e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <FieldError idx={idx} name="price" />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={it.currency}
                      onChange={(e) =>
                        setVal(idx, "currency", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Category (optional)</Label>
                  <Input
                    value={it.category}
                    onChange={(e) => setVal(idx, "category", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={it.description}
                    onChange={(e) => setVal(idx, "description", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`unlimited-${idx}`}
                      checked={it.unlimited}
                      onCheckedChange={(v) => setVal(idx, "unlimited", !!v)}
                    />
                    <Label htmlFor={`unlimited-${idx}`}>Unlimited inventory</Label>
                  </div>

                  {!it.unlimited && (
                    <div>
                      <Label>Quantity Total</Label>
                      <Input
                        type="number"
                        min="0"
                        value={it.quantityTotal}
                        onChange={(e) => setVal(idx, "quantityTotal", e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      <FieldError idx={idx} name="quantityTotal" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Sales Start</Label>
                      <Input
                        type="datetime-local"
                        value={it.salesStartAt}
                        onChange={(e) => setVal(idx, "salesStartAt", e.target.value)}
                      />
                      <FieldError idx={idx} name="salesStartAt" />
                    </div>
                    <div>
                      <Label>Sales End</Label>
                      <Input
                        type="datetime-local"
                        value={it.salesEndAt}
                        onChange={(e) => setVal(idx, "salesEndAt", e.target.value)}
                      />
                      <FieldError idx={idx} name="salesEndAt" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`showRemaining-${idx}`}
                      checked={it.showRemaining}
                      onCheckedChange={(v) => setVal(idx, "showRemaining", !!v)}
                    />
                    <Label htmlFor={`showRemaining-${idx}`}>
                      Show remaining quantity to buyers
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Min per order</Label>
                    <Input
                      type="number"
                      min="1"
                      value={it.minPerOrder}
                      onChange={(e) => setVal(idx, "minPerOrder", e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <FieldError idx={idx} name="minPerOrder" />
                  </div>
                  <div>
                    <Label>Max per order</Label>
                    <Input
                      type="number"
                      min="1"
                      value={it.maxPerOrder}
                      onChange={(e) => setVal(idx, "maxPerOrder", e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <FieldError idx={idx} name="maxPerOrder" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`requiresApproval-${idx}`}
                    checked={it.requiresApproval}
                    onCheckedChange={(v) => setVal(idx, "requiresApproval", !!v)}
                  />
                  <Label htmlFor={`requiresApproval-${idx}`}>
                    Requires organizer approval
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`feesIncluded-${idx}`}
                    checked={it.feesIncluded}
                    onCheckedChange={(v) => setVal(idx, "feesIncluded", !!v)}
                  />
                  <Label htmlFor={`feesIncluded-${idx}`}>Fees included in price</Label>
                </div>

                <div>
                  <Label>Refund policy (optional)</Label>
                  <Textarea
                    value={it.refundPolicy}
                    onChange={(e) => setVal(idx, "refundPolicy", e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`isActive-${idx}`}
                    checked={it.isActive}
                    onCheckedChange={(v) => setVal(idx, "isActive", !!v)}
                  />
                  <Label htmlFor={`isActive-${idx}`}>Active</Label>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={addBlank}>
              <Plus className="h-4 w-4 mr-1" />
              Add Another Ticket
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create All"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
