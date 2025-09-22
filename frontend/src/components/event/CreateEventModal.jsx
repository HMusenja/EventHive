// src/components/event/CreateEventModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
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
import { createEventFormSchema } from "@/utils/eventValidation";
import { mapFormToEventPayload, sanitizeSlug } from "@/utils/eventMappers";
import { useDebounce } from "@/hooks/useDebounce";
import { isSlugAvailable } from "@/api/eventsApi";
import { buildMapEmbedUrl } from "@/utils/buildMap";

export default function CreateEventModal({ open, onOpenChange, onEventCreated }) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(""); setErrors({}); setSubmitting(true);

    if (slugStatus === "checking") { setErrors((p) => ({ ...p, slug: "Please wait, checking slug…" })); setSubmitting(false); return; }
    if (slugStatus === "invalid") { setErrors((p) => ({ ...p, slug: "Slug must be lowercase letters, numbers, and dashes." })); setSubmitting(false); return; }
    if (slugStatus === "taken") { setErrors((p) => ({ ...p, slug: "Slug already in use. Try a different one (e.g., add -2026 or -hamburg)." })); setSubmitting(false); return; }

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

      // close this modal first
      onOpenChange(false);

      // notify parent to open the ticket modal
      if (created?._id) {
        await fetchMyEvents?.();
        onEventCreated?.(created);
      }
    } catch (err) {
      const lower = (err?.message || "").toLowerCase();
      if (lower.includes("slug")) {
        setErrors((p) => ({ ...p, slug: err.message }));
        toast.error(err.message);
      } else {
        const msg = err?.response?.status === 401
          ? "You need to sign in to create an event."
          : err?.message || "Failed to create event. Please try again.";
        setServerError(msg);
        toast.error(msg);
      }
      console.error("[CreateEvent] error:", err);
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  }

  const FieldError = ({ name }) => errors[name] ? <p className="text-sm text-destructive mt-1">{errors[name]}</p> : null;

  return (
    <>
      {/* Event dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Fill out the details below to create a new event.</DialogDescription>
          </DialogHeader>

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
                  onUploadStart={() => updateFormData("__uploadingCover", true)}
                  onUploadEnd={() => updateFormData("__uploadingCover", false)}
                  onChange={(res) => { updateFormData("coverImage", res?.url || ""); }}
                  folder="eventhive/events/covers"
                  disabled={submitting || state.creating}
                  helpText="Recommended 1600×900 (16:9). JPG or PNG."
                  id="coverImageFile"
                  name="coverImageFile"
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="coverImageUrl">Or paste an image URL</Label>
                  <Input
                    id="coverImageUrl"
                    placeholder="https://…/image.jpg"
                    value={formData.coverImage}
                    onChange={(e) => updateFormData("coverImage", e.target.value)}
                    aria-invalid={!!errors.coverImage}
                    disabled={submitting || state.creating || formData.__uploadingCover}
                  />
                  <FieldError name="coverImage" />
                </div>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover preview" className="max-h-48 mx-auto rounded" />
                  ) : (
                    <div className="text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Cover image preview</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basics */}
            <Card>
              <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" required placeholder="Event title" value={formData.title} onChange={handleTitleChange} aria-invalid={!!errors.title} />
                  <FieldError name="title" />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input id="subtitle" placeholder="Event subtitle" value={formData.subtitle} onChange={(e) => updateFormData("subtitle", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      placeholder="event-slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      aria-invalid={!!errors.slug || slugStatus === "taken" || slugStatus === "invalid"}
                      className="flex-1"
                    />
                    {slugStatus === "checking" && (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> checking…
                      </Badge>
                    )}
                    {slugStatus === "available" && (
                      <Badge className="gap-1"><Check className="h-3 w-3" /> available</Badge>
                    )}
                    {slugStatus === "taken" && (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> taken</Badge>
                    )}
                    {slugStatus === "invalid" && <Badge variant="outline">invalid</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">lowercase, numbers & dashes</p>
                  <FieldError name="slug" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Event description" value={formData.description} onChange={(e) => updateFormData("description", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={formData.visibility} onValueChange={(value) => updateFormData("visibility", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onboarding"
                    checked={formData.onboardingEnabled}
                    onCheckedChange={(checked) => updateFormData("onboardingEnabled", checked)}
                  />
                  <Label htmlFor="onboarding">Onboarding Enabled</Label>
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity (0 for unlimited)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={formData.capacity ?? ""}
                    onChange={(e) => updateFormData("capacity", e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    aria-invalid={!!errors.capacity}
                  />
                  <FieldError name="capacity" />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="startDateTime">Start Date/Time *</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    required
                    value={formData.startDateTime}
                    onChange={(e) => updateFormData("startDateTime", e.target.value)}
                    aria-invalid={!!errors.startDateTime}
                  />
                  <FieldError name="startDateTime" />
                </div>
                <div>
                  <Label htmlFor="endDateTime">End Date/Time *</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    required
                    value={formData.endDateTime}
                    onChange={(e) => updateFormData("endDateTime", e.target.value)}
                    aria-invalid={!!errors.endDateTime}
                  />
                  <FieldError name="endDateTime" />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    placeholder="Europe/Berlin"
                    value={formData.timezone}
                    onChange={(e) => updateFormData("timezone", e.target.value)}
                    aria-invalid={!!errors.timezone}
                  />
                  <FieldError name="timezone" />
                </div>
              </CardContent>
            </Card>

            {/* Venue */}
            <Card>
              <CardHeader><CardTitle>Venue</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venueName">Name</Label>
                    <Input id="venueName" placeholder="Venue name" value={formData.venueName} onChange={(e) => updateFormData("venueName", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="venueAddress">Address</Label>
                    <Input id="venueAddress" placeholder="Street address" value={formData.venueAddress} onChange={(e) => updateFormData("venueAddress", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="venueCity">City</Label>
                    <Input id="venueCity" placeholder="City" value={formData.venueCity} onChange={(e) => updateFormData("venueCity", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="venueCountry">Country</Label>
                    <Input id="venueCountry" placeholder="Country" value={formData.venueCountry} onChange={(e) => updateFormData("venueCountry", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="venueLatitude">Latitude</Label>
                    <Input id="venueLatitude" type="number" step="any" placeholder="52.520008" value={formData.venueLatitude} onChange={(e) => updateFormData("venueLatitude", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="venueLongitude">Longitude</Label>
                    <Input id="venueLongitude" type="number" step="any" placeholder="13.404954" value={formData.venueLongitude} onChange={(e) => updateFormData("venueLongitude", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mapEmbedUrl">Map Embed URL</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="autoMap" checked={autoMap} onCheckedChange={(v) => setAutoMap(!!v)} />
                        <Label htmlFor="autoMap" className="text-sm">Auto-generate from venue</Label>
                      </div>
                      {!autoMap && mapCandidate && mapCandidate !== formData.mapEmbedUrl && (
                        <Button type="button" variant="outline" size="sm" onClick={() => updateFormData("mapEmbedUrl", mapCandidate)}>
                          Use suggested map
                        </Button>
                      )}
                    </div>
                  </div>

                  <Input
                    id="mapEmbedUrl"
                    placeholder="https://maps.google.com/maps?q=…&z=15&output=embed"
                    value={formData.mapEmbedUrl}
                    onChange={onManualMapChange}
                    aria-invalid={!!errors.mapEmbedUrl}
                  />
                  <FieldError name="mapEmbedUrl" />

                  {(formData.mapEmbedUrl || mapCandidate) ? (
                    <div className="mt-3 rounded-md overflow-hidden border">
                      <iframe
                        title="Venue map"
                        src={formData.mapEmbedUrl || mapCandidate}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enter a venue address or coordinates to preview the map.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organizer Profile */}
            <Card>
              <CardHeader><CardTitle>Organizer Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="organizerName">Name *</Label>
                  <Input
                    id="organizerName"
                    required
                    placeholder="Organizer name"
                    value={formData.organizerName}
                    onChange={(e) => updateFormData("organizerName", e.target.value)}
                    aria-invalid={!!errors.organizerName}
                  />
                  <FieldError name="organizerName" />
                </div>
                <div>
                  <Label htmlFor="organizerWebsite">Website</Label>
                  <Input
                    id="organizerWebsite"
                    placeholder="https://example.com"
                    value={formData.organizerWebsite}
                    onChange={(e) => updateFormData("organizerWebsite", e.target.value)}
                    aria-invalid={!!errors.organizerWebsite}
                  />
                  <FieldError name="organizerWebsite" />
                </div>
                <div>
                  <Label htmlFor="organizerBio">Bio</Label>
                  <Textarea
                    id="organizerBio"
                    placeholder="Organizer bio"
                    value={formData.organizerBio}
                    onChange={(e) => updateFormData("organizerBio", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="organizerAvatar">Avatar URL</Label>
                  <Input
                    id="organizerAvatar"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.organizerAvatar}
                    onChange={(e) => updateFormData("organizerAvatar", e.target.value)}
                    aria-invalid={!!errors.organizerAvatar}
                  />
                  <FieldError name="organizerAvatar" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizerTwitter">Twitter</Label>
                    <Input id="organizerTwitter" placeholder="@username" value={formData.organizerTwitter} onChange={(e) => updateFormData("organizerTwitter", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="organizerLinkedIn">LinkedIn</Label>
                    <Input id="organizerLinkedIn" placeholder="https://linkedin.com/in/username" value={formData.organizerLinkedIn} onChange={(e) => updateFormData("organizerLinkedIn", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="organizerGitHub">GitHub</Label>
                    <Input id="organizerGitHub" placeholder="https://github.com/username" value={formData.organizerGitHub} onChange={(e) => updateFormData("organizerGitHub", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="organizerWebsiteUrl">Website</Label>
                    <Input id="organizerWebsiteUrl" placeholder="https://example.com" value={formData.organizerWebsiteUrl} onChange={(e) => updateFormData("organizerWebsiteUrl", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced: Speakers & Agenda */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced (Speakers & Agenda)</AccordionTrigger>
                <AccordionContent>
                  {/* Speakers */}
                  <Card className="mt-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Speakers</CardTitle>
                        <Button type="button" onClick={addSpeaker} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Speaker
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.speakers.map((speaker) => (
                        <Card key={speaker.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-medium">Speaker</h4>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeSpeaker(speaker.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Name *</Label>
                                <Input required placeholder="Speaker name" value={speaker.name} onChange={(e) => updateSpeaker(speaker.id, "name", e.target.value)} />
                              </div>
                              <div>
                                <Label>Title</Label>
                                <Input placeholder="Job title" value={speaker.title} onChange={(e) => updateSpeaker(speaker.id, "title", e.target.value)} />
                              </div>
                              <div>
                                <Label>Company</Label>
                                <Input placeholder="Company" value={speaker.company} onChange={(e) => updateSpeaker(speaker.id, "company", e.target.value)} />
                              </div>
                              <div>
                                <Label>Avatar URL</Label>
                                <Input placeholder="https://example.com/avatar.jpg" value={speaker.avatarUrl} onChange={(e) => updateSpeaker(speaker.id, "avatarUrl", e.target.value)} />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label>Bio</Label>
                              <Textarea placeholder="Speaker bio" value={speaker.bio} onChange={(e) => updateSpeaker(speaker.id, "bio", e.target.value)} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Agenda */}
                  <Card className="mt-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Agenda</CardTitle>
                        <Button type="button" onClick={addSession} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Session
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.agenda.map((session) => (
                        <Card key={session.id} className="border-l-4 border-l-secondary">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-medium">Session</h4>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeSession(session.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label>Title *</Label>
                                <Input required placeholder="Session title" value={session.title} onChange={(e) => updateSession(session.id, "title", e.target.value)} />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea placeholder="Session description" value={session.description} onChange={(e) => updateSession(session.id, "description", e.target.value)} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Start Date/Time *</Label>
                                  <Input type="datetime-local" required value={session.startDateTime} onChange={(e) => updateSession(session.id, "startDateTime", e.target.value)} />
                                </div>
                                <div>
                                  <Label>End Date/Time *</Label>
                                  <Input type="datetime-local" required value={session.endDateTime} onChange={(e) => updateSession(session.id, "endDateTime", e.target.value)} />
                                </div>
                                <div>
                                  <Label>Room</Label>
                                  <Input placeholder="Room name" value={session.room} onChange={(e) => updateSession(session.id, "room", e.target.value)} />
                                </div>
                                <div>
                                  <Label>Track</Label>
                                  <Input placeholder="Track name" value={session.track} onChange={(e) => updateSession(session.id, "track", e.target.value)} />
                                </div>
                              </div>
                              <div>
                                <Label>Speaker Names (comma-separated)</Label>
                                <Input placeholder="John Doe, Jane Smith" value={session.speakerNames} onChange={(e) => updateSession(session.id, "speakerNames", e.target.value)} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Footer */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting || state.creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={
                  submitting ||
                  state.creating ||
                  slugStatus === "checking" ||
                  slugStatus === "taken" ||
                  slugStatus === "invalid"
                }
              >
                {submitting || state.creating ? "Creating…" : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

     
     
    </>
  );
}
