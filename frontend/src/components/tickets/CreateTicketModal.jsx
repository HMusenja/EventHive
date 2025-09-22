// src/components/tickets/CreateTicketModal.jsx
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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const schema = z
  .object({
    title: z.string().min(2, "Title is required"),
    type: z.enum(["free", "paid"]),
    price: z.number().min(0), // UI only; we map to priceCents
    currency: z.string().min(3),
    unlimited: z.boolean().default(false),
    quantityTotal: z.number().int().min(0).nullable(),
    showRemaining: z.boolean().default(false),
    minPerOrder: z.number().int().min(1).default(1),
    maxPerOrder: z.number().int().min(1).default(10),
    salesStartAt: z.string().optional(), // local datetime input
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

function toNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export default function CreateTicketModal({
  open,
  onOpenChange,
  eventId,
  eventEndAt, // optional ISO string to default salesEndAt
}) {
  const { create } = useOrganizerTickets();
  const { user } = useAuth();

  const nowLocal = useMemo(() => new Date().toISOString().slice(0, 16), []);
  const eventEndLocal = useMemo(
    () => (eventEndAt ? new Date(eventEndAt).toISOString().slice(0, 16) : ""),
    [eventEndAt]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
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
  });


  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
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
      }));
      setErrors({});
    }
  }, [open, nowLocal, eventEndLocal]);
    
  const setVal = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const raw = {
      ...form,
      price: form.type === "free" ? 0 : Number(Number(form.price).toFixed(2)),
      quantityTotal: form.unlimited ? null : toNumber(form.quantityTotal, 0),
      minPerOrder: toNumber(form.minPerOrder, 1),
      maxPerOrder: toNumber(form.maxPerOrder, 10),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const map = {};
      for (const issue of parsed.error.issues) {
        map[issue.path.join(".")] = issue.message;
      }
      setErrors(map);
      return null;
    }
    // extra client checks
    const start = form.salesStartAt ? new Date(form.salesStartAt) : null;
    const end = form.salesEndAt ? new Date(form.salesEndAt) : null;
    if (start && end && start > end) {
      setErrors((e) => ({ ...e, salesEndAt: "End must be after start" }));
      return null;
    }
    if (raw.maxPerOrder < raw.minPerOrder) {
      setErrors((e) => ({ ...e, maxPerOrder: "Max must be >= Min" }));
      return null;
    }
    setErrors({});
    return parsed.data;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) { toast.error("You need to sign in as organizer"); return; }
  if (!eventId) { toast.error("Missing eventId"); return; }

  const data = validate();
  if (!data) return;

  const toInt = (n, fb) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.trunc(v) : fb;
  };
  const toMoneyCents = (n) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 100) : 0;
  };
  const isoOrUndef = (v) => (v ? new Date(v).toISOString() : undefined);
  const stripUndef = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

  const isPaid = data.type === "paid";
  const payload = stripUndef({
    name: data.title,
    title: data.title,
    priceCents: isPaid ? toMoneyCents(data.price) : 0, // ✅ required by backend, 0 for free
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

  let success = false;
  try {
    setSubmitting(true);
    const created = await create(eventId, payload); // throws on error in context
    success = !!created?._id;
    if (success) {
      toast.success("Ticket created successfully");
      onOpenChange(false); // ✅ close the modal
    }
  } finally {
    setSubmitting(false);
  }
};


  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="text-sm text-destructive mt-1">{errors[name]}</p>
    ) : null;

  return (
     <Dialog
  open={open}
  onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}
>
    <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        // Prevent closing via overlay/Escape while submitting
        onPointerDownOutside={(e) => submitting && e.preventDefault()}
        onEscapeKeyDown={(e) => submitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
          <DialogDescription>
            Define availability, pricing, and limits for this ticket type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="t-title">Title *</Label>
                <Input
                  id="t-title"
                  value={form.title}
                  onChange={(e) => setVal("title", e.target.value)}
                  required
                />
                <FieldError name="title" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setVal("type", v)}
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
                  <Label>Price {form.type === "free" ? "(€0.00)" : ""}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={form.type === "free"}
                    value={form.type === "free" ? 0 : form.price}
                    onChange={(e) => setVal("price", e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError name="price" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) =>
                      setVal("currency", e.target.value.toUpperCase())
                    }
                  />
                  <p className="text-xs text-muted-foreground">Default EUR</p>
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setVal("category", e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setVal("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory & Sales Window</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="unlimited"
                  checked={form.unlimited}
                  onCheckedChange={(v) => setVal("unlimited", !!v)}
                />
                <Label htmlFor="unlimited">Unlimited inventory</Label>
              </div>

              {!form.unlimited && (
                <div>
                  <Label>Quantity Total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.quantityTotal}
                    onChange={(e) => setVal("quantityTotal", e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError name="quantityTotal" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sales Start</Label>
                  <Input
                    type="datetime-local"
                    value={form.salesStartAt}
                    onChange={(e) => setVal("salesStartAt", e.target.value)}
                  />
                  <FieldError name="salesStartAt" />
                </div>
                <div>
                  <Label>Sales End</Label>
                  <Input
                    type="datetime-local"
                    value={form.salesEndAt}
                    onChange={(e) => setVal("salesEndAt", e.target.value)}
                  />
                  <FieldError name="salesEndAt" />
                  <p className="text-xs text-muted-foreground">
                    Defaults to event end time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showRemaining"
                  checked={form.showRemaining}
                  onCheckedChange={(v) => setVal("showRemaining", !!v)}
                />
                <Label htmlFor="showRemaining">
                  Show remaining quantity to buyers
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limits & Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Min per order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.minPerOrder}
                    onChange={(e) => setVal("minPerOrder", e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError name="minPerOrder" />
                </div>
                <div>
                  <Label>Max per order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.maxPerOrder}
                    onChange={(e) => setVal("maxPerOrder", e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError name="maxPerOrder" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="requiresApproval"
                  checked={form.requiresApproval}
                  onCheckedChange={(v) => setVal("requiresApproval", !!v)}
                />
                <Label htmlFor="requiresApproval">
                  Requires organizer approval
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="feesIncluded"
                  checked={form.feesIncluded}
                  onCheckedChange={(v) => setVal("feesIncluded", !!v)}
                />
                <Label htmlFor="feesIncluded">Fees included in price</Label>
              </div>

              <div>
                <Label>Refund policy (optional)</Label>
                <Textarea
                  value={form.refundPolicy}
                  onChange={(e) => setVal("refundPolicy", e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => setVal("isActive", !!v)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
