// src/pages/dashboard/organizer/CreateEventPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Image as ImageIcon, Check, XCircle, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import ImageUploader from "@/components/media/ImageUploader";
import { useEvents } from "@/context/EventContext";
import { OrganizerTicketProvider } from "@/context/OrganizerTicketContext";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { createEventFormSchema } from "@/utils/eventValidation";
import { mapFormToEventPayload, sanitizeSlug } from "@/utils/eventMappers";
import { useDebounce } from "@/hooks/useDebounce";
import { isSlugAvailable } from "@/api/eventsApi";
import { buildMapEmbedUrl } from "@/utils/buildMap";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { createEvent, fetchMyEvents, state } = useEvents();
  const [autoMap, setAutoMap] = useState(true);

  const [formData, setFormData] = useState({
    coverImage: "",
    title: "",
    subtitle: "",
    slug: "",
    description: "",
    visibility: "public",
    onboardingEnabled: true,
    capacity: "",
    startDateTime: "",
    endDateTime: "",
    timezone: "Europe/Berlin",
    venueName: "",
    venueAddress: "",
    venueCity: "",
    venueCountry: "",
    venueLatitude: "",
    venueLongitude: "",
    mapEmbedUrl: "",
    organizerName: "",
    organizerWebsite: "",
    organizerBio: "",
    organizerAvatar: "",
    organizerTwitter: "",
    organizerLinkedIn: "",
    organizerGitHub: "",
    organizerWebsiteUrl: "",
    speakers: [],
    agenda: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [openCreateTicket, setOpenCreateTicket] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [createdEventEndAt, setCreatedEventEndAt] = useState("");

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const [slugStatus, setSlugStatus] = useState("idle");
  const debouncedSlug = useDebounce(formData.slug, 400);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const slug = debouncedSlug?.trim();
      if (!slug) { setSlugStatus("invalid"); return; }
      if (!/^[a-z0-9-]+$/.test(slug)) { setSlugStatus("invalid"); return; }
      setSlugStatus("checking");
      const available = await isSlugAvailable(slug);
      if (!cancelled) setSlugStatus(available ? "available" : "taken");
    }
    if (debouncedSlug !== undefined) run();
    return () => { cancelled = true; };
  }, [debouncedSlug]);

  const mapCandidate = useMemo(() => {
    return buildMapEmbedUrl({
      lat: formData.venueLatitude,
      lng: formData.venueLongitude,
      venueName: formData.venueName,
      venueAddress: formData.venueAddress,
      venueCity: formData.venueCity,
      venueCountry: formData.venueCountry,
    });
  }, [formData.venueLatitude, formData.venueLongitude, formData.venueName, formData.venueAddress, formData.venueCity, formData.venueCountry]);

  useEffect(() => {
    if (!autoMap) return;
    if (mapCandidate && mapCandidate !== formData.mapEmbedUrl) {
      setFormData((prev) => ({ ...prev, mapEmbedUrl: mapCandidate }));
    }
  }, [autoMap, mapCandidate, formData.mapEmbedUrl]);

  const onManualMapChange = (e) => {
    if (autoMap) setAutoMap(false);
    updateFormData("mapEmbedUrl", e.target.value);
  };

  const updateFormData = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const handleTitleChange = (e) => { const t = e.target.value; updateFormData("title", t); if (!formData.slug) updateFormData("slug", generateSlug(t)); };
  const handleSlugChange = (e) => updateFormData("slug", sanitizeSlug(e.target.value));

  const addSpeaker = () => setFormData((prev) => ({ ...prev, speakers: [...prev.speakers, { id: Date.now(), name: "", title: "", company: "", bio: "", avatarUrl: "" }] }));
  const removeSpeaker = (id) => setFormData((prev) => ({ ...prev, speakers: prev.speakers.filter((s) => s.id !== id) }));
  const updateSpeaker = (id, field, value) => setFormData((prev) => ({ ...prev, speakers: prev.speakers.map((s) => (s.id === id ? { ...s, [field]: value } : s)) }));

  const addSession = () => setFormData((prev) => ({ ...prev, agenda: [...prev.agenda, { id: Date.now(), title: "", description: "", startDateTime: "", endDateTime: "", room: "", track: "", speakerNames: "" }] }));
  const removeSession = (id) => setFormData((prev) => ({ ...prev, agenda: prev.agenda.filter((s) => s.id !== id) }));
  const updateSession = (id, field, value) => setFormData((prev) => ({ ...prev, agenda: prev.agenda.map((s) => (s.id === id ? { ...s, [field]: value } : s)) }));

  const toNumberOrZero = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(""); setErrors({}); setSubmitting(true);

    if (slugStatus === "checking") { setErrors((p) => ({ ...p, slug: "Please wait, checking slug…" })); setSubmitting(false); return; }
    if (slugStatus === "invalid") { setErrors((p) => ({ ...p, slug: "Slug must be lowercase letters, numbers, and dashes." })); setSubmitting(false); return; }
    if (slugStatus === "taken") { setErrors((p) => ({ ...p, slug: "Slug already in use." })); setSubmitting(false); return; }

    const toValidate = { ...formData, capacity: toNumberOrZero(formData.capacity) };
    const parsed = createEventFormSchema.safeParse(toValidate);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) {
        const el = document.querySelector(`[id="${firstKey.split(".").pop()}"]`);
        el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        el?.focus?.();
      }
      setSubmitting(false);
      return;
    }

    try {
      const payload = mapFormToEventPayload(parsed.data);
      const created = await createEvent(payload);
      toast.success("Event created");

      // Refresh events
      await fetchMyEvents?.();

      // Open ticket modal
      if (created?._id) {
        setCreatedEventId(created._id);
        setCreatedEventEndAt(created.endAt || "");
        setOpenCreateTicket(true);
      }
    } catch (err) {
      const msg = err?.message || "Failed to create event.";
      setServerError(msg);
      toast.error(msg);
      console.error("[CreateEventPage] error:", err);
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  const FieldError = ({ name }) => errors[name] ? <p className="text-sm text-destructive mt-1">{errors[name]}</p> : null;

    return (
   <OrganizerTicketProvider>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

        {serverError && (
          <Alert variant="destructive" className="mb-2">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Couldn’t create the event</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Cover Image */}
        <Card>
          <CardHeader><CardTitle>Cover Image</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ImageUploader
              label="Cover image"
              value={formData.coverImage}
              onChange={(res) => updateFormData("coverImage", res?.url || "")}
              folder="eventhive/events/covers"
            />
            <div>
              <Label htmlFor="coverImageUrl">Or paste an image URL</Label>
              <Input id="coverImageUrl" placeholder="https://…" value={formData.coverImage} onChange={(e) => updateFormData("coverImage", e.target.value)} />
            </div>
            {formData.coverImage && <img src={formData.coverImage} alt="Cover preview" className="max-h-48 mx-auto rounded" />}
          </CardContent>
        </Card>

        {/* Basics */}
        <Card>
          <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" required placeholder="Event title" value={formData.title} onChange={handleTitleChange} />
              <FieldError name="title" />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" placeholder="Event subtitle" value={formData.subtitle} onChange={(e) => updateFormData("subtitle", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <Input id="slug" value={formData.slug} onChange={handleSlugChange} />
                {slugStatus === "checking" && <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin" /> checking…</Badge>}
                {slugStatus === "available" && <Badge><Check className="h-3 w-3" /> available</Badge>}
                {slugStatus === "taken" && <Badge variant="destructive"><XCircle className="h-3 w-3" /> taken</Badge>}
                {slugStatus === "invalid" && <Badge variant="outline">invalid</Badge>}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Event description" value={formData.description} onChange={(e) => updateFormData("description", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startDateTime">Start Date/Time *</Label>
              <Input type="datetime-local" required value={formData.startDateTime} onChange={(e) => updateFormData("startDateTime", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDateTime">End Date/Time *</Label>
              <Input type="datetime-local" required value={formData.endDateTime} onChange={(e) => updateFormData("endDateTime", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input value={formData.timezone} onChange={(e) => updateFormData("timezone", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Venue */}
        <Card>
          <CardHeader><CardTitle>Venue</CardTitle></CardHeader>
          <CardContent className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={formData.venueName} onChange={(e) => updateFormData("venueName", e.target.value)} /></div>
            <div><Label>Address</Label><Input value={formData.venueAddress} onChange={(e) => updateFormData("venueAddress", e.target.value)} /></div>
            <div><Label>City</Label><Input value={formData.venueCity} onChange={(e) => updateFormData("venueCity", e.target.value)} /></div>
            <div><Label>Country</Label><Input value={formData.venueCountry} onChange={(e) => updateFormData("venueCountry", e.target.value)} /></div>
            <div><Label>Latitude</Label><Input type="number" step="any" value={formData.venueLatitude} onChange={(e) => updateFormData("venueLatitude", e.target.value)} /></div>
            <div><Label>Longitude</Label><Input type="number" step="any" value={formData.venueLongitude} onChange={(e) => updateFormData("venueLongitude", e.target.value)} /></div>

            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Map Embed URL</Label>
                <div className="flex items-center gap-2">
                  <Checkbox checked={autoMap} onCheckedChange={(v) => setAutoMap(!!v)} />
                  <span>Auto-generate from venue</span>
                  {!autoMap && mapCandidate && mapCandidate !== formData.mapEmbedUrl && (
                    <Button type="button" variant="outline" size="sm" onClick={() => updateFormData("mapEmbedUrl", mapCandidate)}>Use suggested map</Button>
                  )}
                </div>
              </div>
              <Input value={formData.mapEmbedUrl} onChange={onManualMapChange} />
              {(formData.mapEmbedUrl || mapCandidate) && (
                <iframe title="Venue map" src={formData.mapEmbedUrl || mapCandidate} className="w-full h-60 border mt-2" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organizer Profile */}
        <Card>
          <CardHeader><CardTitle>Organizer Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Name *</Label><Input value={formData.organizerName} onChange={(e) => updateFormData("organizerName", e.target.value)} /></div>
            <div><Label>Website</Label><Input value={formData.organizerWebsite} onChange={(e) => updateFormData("organizerWebsite", e.target.value)} /></div>
            <div><Label>Bio</Label><Textarea value={formData.organizerBio} onChange={(e) => updateFormData("organizerBio", e.target.value)} /></div>
            <div><Label>Avatar URL</Label><Input value={formData.organizerAvatar} onChange={(e) => updateFormData("organizerAvatar", e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Accordion type="single" collapsible defaultValue="advanced">
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced (Speakers & Agenda)</AccordionTrigger>
            <AccordionContent>
              {/* Speakers */}
              <Card className="mt-4">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>Speakers</CardTitle>
                  <Button type="button" onClick={addSpeaker} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Speaker</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.speakers.map((speaker) => (
                    <Card key={speaker.id} className="border-l-4 border-l-primary">
                      <CardContent>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Speaker</h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSpeaker(speaker.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><Label>Name *</Label><Input value={speaker.name} onChange={(e) => updateSpeaker(speaker.id, "name", e.target.value)} /></div>
                          <div><Label>Title</Label><Input value={speaker.title} onChange={(e) => updateSpeaker(speaker.id, "title", e.target.value)} /></div>
                          <div><Label>Company</Label><Input value={speaker.company} onChange={(e) => updateSpeaker(speaker.id, "company", e.target.value)} /></div>
                          <div><Label>Avatar URL</Label><Input value={speaker.avatarUrl} onChange={(e) => updateSpeaker(speaker.id, "avatarUrl", e.target.value)} /></div>
                        </div>
                        <div><Label>Bio</Label><Textarea value={speaker.bio} onChange={(e) => updateSpeaker(speaker.id, "bio", e.target.value)} /></div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Agenda */}
              <Card className="mt-4">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>Agenda</CardTitle>
                  <Button type="button" onClick={addSession} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Session</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.agenda.map((session) => (
                    <Card key={session.id} className="border-l-4 border-l-secondary">
                      <CardContent>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Session</h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSession(session.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div><Label>Title *</Label><Input value={session.title} onChange={(e) => updateSession(session.id, "title", e.target.value)} /></div>
                          <div><Label>Description</Label><Textarea value={session.description} onChange={(e) => updateSession(session.id, "description", e.target.value)} /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Start Date/Time *</Label><Input type="datetime-local" value={session.startDateTime} onChange={(e) => updateSession(session.id, "startDateTime", e.target.value)} /></div>
                            <div><Label>End Date/Time *</Label><Input type="datetime-local" value={session.endDateTime} onChange={(e) => updateSession(session.id, "endDateTime", e.target.value)} /></div>
                            <div><Label>Room</Label><Input value={session.room} onChange={(e) => updateSession(session.id, "room", e.target.value)} /></div>
                            <div><Label>Track</Label><Input value={session.track} onChange={(e) => updateSession(session.id, "track", e.target.value)} /></div>
                          </div>
                          <div><Label>Speaker Names (comma-separated)</Label><Input value={session.speakerNames} onChange={(e) => updateSession(session.id, "speakerNames", e.target.value)} /></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/organizer/events")} disabled={submitting || state.creating}>Cancel</Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting || state.creating || slugStatus === "checking" || slugStatus === "taken" || slugStatus === "invalid"}>
            {submitting || state.creating ? "Creating…" : "Create Event"}
          </Button>
        </div>

          </form>
          <CreateTicketModal
          key={createdEventId || "new"}
          open={openCreateTicket}
          onOpenChange={setOpenCreateTicket}
          eventId={createdEventId}
          eventEndAt={createdEventEndAt}
        />
      </div>
    </OrganizerTicketProvider>
  );
}