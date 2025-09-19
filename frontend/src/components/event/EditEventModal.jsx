import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEvents } from "@/context/EventContext";
import ImageUploader from "@/components/media/ImageUploader";
import { AnimatePresence, motion } from "framer-motion";

// utils
import {
  getInitials,
  buildSchemaFromForm,
  schemaFromEvent,
  deepDiff,
  fixPatchForRequireds,
} from "@/lib/eventUtils";

export default function EditEventModal({ open, onOpenChange, event }) {
  const {
    updateEvent,
    state: { updating },
  } = useEvents();

  const [activeTab, setActiveTab] = useState("basics");

  const [formData, setFormData] = useState({
    coverImage: "",
    title: "",
    subtitle: "",
    slug: "",
    description: "",
    visibility: "public",
    onboardingEnabled: true,
    capacity: 0,
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

  // Prefill
  useEffect(() => {
    if (!event) return;
    setFormData({
      coverImage: event.coverImage || "",
      title: event.title || "",
      subtitle: event.subtitle || "",
      slug: event.slug || "",
      description: event.description || "",
      visibility: event.visibility || "public",
      onboardingEnabled: event.onboardingEnabled !== undefined ? event.onboardingEnabled : true,
      capacity: event.capacity || 0,
      startDateTime: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : "",
      endDateTime: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : "",
      timezone: event.timezone || "Europe/Berlin",
      venueName: event.venue?.name || "",
      venueAddress: event.venue?.address || "",
      venueCity: event.venue?.city || "",
      venueCountry: event.venue?.country || "",
      venueLatitude: event.venue?.lat ?? "",
      venueLongitude: event.venue?.lng ?? "",
      mapEmbedUrl: event.venue?.mapEmbedUrl || "",
      organizerName: event.organizerProfile?.name || "",
      organizerWebsite: event.organizerProfile?.website || "",
      organizerBio: event.organizerProfile?.bio || "",
      organizerAvatar: event.organizerProfile?.avatarUrl || "",
      organizerTwitter: event.organizerProfile?.socials?.twitter || "",
      organizerLinkedIn: event.organizerProfile?.socials?.linkedin || "",
      organizerGitHub: event.organizerProfile?.socials?.github || "",
      organizerWebsiteUrl: event.organizerProfile?.socials?.website || "",
      speakers: Array.isArray(event.speakers) ? event.speakers : [],
      agenda: Array.isArray(event.agenda) ? event.agenda : [],
    });
    setActiveTab("basics");
  }, [event]);

  // Local setters
  const updateFormData = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const addSpeaker = () =>
    setFormData((p) => ({
      ...p,
      speakers: [
        ...p.speakers,
        {
          id: crypto?.randomUUID?.() || Date.now(),
          name: "",
          title: "",
          company: "",
          bio: "",
          avatarUrl: "",
        },
      ],
    }));

  const removeSpeaker = (id) =>
    setFormData((p) => ({
      ...p,
      speakers: p.speakers.filter((s) => (s._id || s.id) !== id),
    }));

  const updateSpeaker = (id, field, value) =>
    setFormData((p) => ({
      ...p,
      speakers: p.speakers.map((s) => ((s._id || s.id) === id ? { ...s, [field]: value } : s)),
    }));

  const addSession = () =>
    setFormData((p) => ({
      ...p,
      agenda: [
        ...p.agenda,
        {
          id: crypto?.randomUUID?.() || Date.now(),
          title: "",
          description: "",
          startDateTime: "",
          endDateTime: "",
          room: "",
          track: "",
          speakerNames: "",
        },
      ],
    }));

  const removeSession = (id) =>
    setFormData((p) => ({
      ...p,
      agenda: p.agenda.filter((s) => (s._id || s.id) !== id),
    }));

  const updateSession = (id, field, value) =>
    setFormData((p) => ({
      ...p,
      agenda: p.agenda.map((s) => ((s._id || s.id) === id ? { ...s, [field]: value } : s)),
    }));

  // Basic validation
  function validate(fd) {
    const errors = {};
    if (!fd.title?.trim()) errors.title = "Title is required.";
    if (!fd.startDateTime) errors.startDateTime = "Start date/time is required.";
    if (!fd.endDateTime) errors.endDateTime = "End date/time is required.";
    if (fd.startDateTime && fd.endDateTime) {
      const s = new Date(fd.startDateTime).getTime();
      const e = new Date(fd.endDateTime).getTime();
      if (e <= s) errors.endDateTime = "End must be after start.";
    }
    return errors;
  }

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event?._id) return;

    const errs = validate(formData);
    if (Object.keys(errs).length) {
      if (errs.title || errs.startDateTime || errs.endDateTime) {
        setActiveTab("basics");
      }
      return;
    }

    const baseline = schemaFromEvent(event);
    const current = buildSchemaFromForm(formData);
    let patch = deepDiff(baseline, current);
    patch = fixPatchForRequireds(patch, baseline);

    if (!patch || (typeof patch === "object" && !Object.keys(patch).length)) {
      onOpenChange?.(false);
      return;
    }

    try {
      await updateEvent(event._id, patch);
      onOpenChange?.(false);
    } catch (err) {
      console.error("[edit] update failed:", err?.response?.data || err);
    }
  };

  // Smooth tab panel wrapper
  const Panel = ({ value, current, children }) => (
    <TabsContent value={value} forceMount>
      <AnimatePresence mode="wait">
        {current === value && (
          <motion.div
            key={value}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="min-h-[50vh]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </TabsContent>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl md:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-4 pt-4 pb-2 md:px-6">
            <DialogTitle>Edit Event</DialogTitle>
            <DialogClose aria-label="Close" className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </DialogClose>
            <DialogDescription>
              Edit basics, schedule, venue, organizer, media, speakers, and agenda.
            </DialogDescription>
          </DialogHeader>

          {/* Tabs header — mobile-first: horizontal scroll */}
          <div className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full overflow-x-auto gap-1 justify-start">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="venue">Venue</TabsTrigger>
                <TabsTrigger value="organizer">Organizer</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
              </TabsList>

              {/* Body */}
              <div className="overflow-y-auto">
                {/* BASICS */}
                <Panel value="basics" current={activeTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Basics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData("title", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input
                          id="subtitle"
                          value={formData.subtitle}
                          onChange={(e) => updateFormData("subtitle", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => updateFormData("slug", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData("description", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select
                          value={formData.visibility}
                          onValueChange={(v) => updateFormData("visibility", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="onboarding"
                          checked={formData.onboardingEnabled}
                          onCheckedChange={(c) =>
                            updateFormData("onboardingEnabled", Boolean(c))
                          }
                        />
                        <Label htmlFor="onboarding">Onboarding Enabled</Label>
                      </div>

                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="0"
                          value={formData.capacity}
                          onChange={(e) =>
                            updateFormData("capacity", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Panel>

                {/* SCHEDULE */}
                <Panel value="schedule" current={activeTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="startDateTime">Start</Label>
                        <Input
                          id="startDateTime"
                          type="datetime-local"
                          value={formData.startDateTime}
                          onChange={(e) => updateFormData("startDateTime", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="endDateTime">End</Label>
                        <Input
                          id="endDateTime"
                          type="datetime-local"
                          value={formData.endDateTime}
                          onChange={(e) => updateFormData("endDateTime", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                          id="timezone"
                          value={formData.timezone}
                          onChange={(e) => updateFormData("timezone", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Panel>

                {/* VENUE */}
                <Panel value="venue" current={activeTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Venue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="venueName">Name</Label>
                        <Input
                          id="venueName"
                          value={formData.venueName}
                          onChange={(e) => updateFormData("venueName", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="venueAddress">Address</Label>
                        <Input
                          id="venueAddress"
                          value={formData.venueAddress}
                          onChange={(e) => updateFormData("venueAddress", e.target.value)}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="venueCity">City</Label>
                          <Input
                            id="venueCity"
                            value={formData.venueCity}
                            onChange={(e) => updateFormData("venueCity", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="venueCountry">Country</Label>
                          <Input
                            id="venueCountry"
                            value={formData.venueCountry}
                            onChange={(e) => updateFormData("venueCountry", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="venueLatitude">Latitude</Label>
                          <Input
                            id="venueLatitude"
                            type="number"
                            step="any"
                            value={formData.venueLatitude}
                            onChange={(e) => updateFormData("venueLatitude", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="venueLongitude">Longitude</Label>
                          <Input
                            id="venueLongitude"
                            type="number"
                            step="any"
                            value={formData.venueLongitude}
                            onChange={(e) => updateFormData("venueLongitude", e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="mapEmbedUrl">Map Embed URL</Label>
                        <Input
                          id="mapEmbedUrl"
                          value={formData.mapEmbedUrl}
                          onChange={(e) => updateFormData("mapEmbedUrl", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Panel>

                {/* ORGANIZER */}
                <Panel value="organizer" current={activeTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Organizer Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="organizerName">Name</Label>
                        <Input
                          id="organizerName"
                          value={formData.organizerName}
                          onChange={(e) => updateFormData("organizerName", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="organizerWebsite">Website</Label>
                        <Input
                          id="organizerWebsite"
                          value={formData.organizerWebsite}
                          onChange={(e) => updateFormData("organizerWebsite", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="organizerBio">Bio</Label>
                        <Textarea
                          id="organizerBio"
                          value={formData.organizerBio}
                          onChange={(e) => updateFormData("organizerBio", e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <Avatar title={formData.organizerName || "Organizer avatar"} style={{ height: 56, width: 56 }}>
                          <AvatarImage
                            src={formData.organizerAvatar || ""}
                            alt={formData.organizerName || "Organizer"}
                            className="object-cover rounded"
                          />
                          <AvatarFallback>
                            {getInitials(formData.organizerName || "Organizer")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <ImageUploader
                            label="Organizer Avatar"
                            value={formData.organizerAvatar || ""}
                            onChange={(res) => updateFormData("organizerAvatar", res?.url || "")}
                            folder="eventhive/organizers"
                            helpText="Square images work best."
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="organizerTwitter">Twitter</Label>
                          <Input
                            id="organizerTwitter"
                            value={formData.organizerTwitter}
                            onChange={(e) => updateFormData("organizerTwitter", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizerLinkedIn">LinkedIn</Label>
                          <Input
                            id="organizerLinkedIn"
                            value={formData.organizerLinkedIn}
                            onChange={(e) => updateFormData("organizerLinkedIn", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizerGitHub">GitHub</Label>
                          <Input
                            id="organizerGitHub"
                            value={formData.organizerGitHub}
                            onChange={(e) => updateFormData("organizerGitHub", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizerWebsiteUrl">Website (Socials)</Label>
                          <Input
                            id="organizerWebsiteUrl"
                            value={formData.organizerWebsiteUrl}
                            onChange={(e) => updateFormData("organizerWebsiteUrl", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Panel>

                {/* MEDIA */}
                <Panel value="media" current={activeTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Cover Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline">
                          <Upload className="h-4 w-4" />
                          Upload via Cloudinary
                        </Button>
                      </div>

                      <ImageUploader
                        label="Cover Image"
                        value={formData.coverImage || ""}
                        onChange={(res) => updateFormData("coverImage", res?.url || "")}
                        folder="eventhive/events"
                        helpText="Use a wide image for best results."
                      />

                      <div>
                        <Label htmlFor="coverImageUrl">Or paste image URL</Label>
                        <Input
                          id="coverImageUrl"
                          value={formData.coverImage}
                          onChange={(e) => updateFormData("coverImage", e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div>
                        {formData.coverImage ? (
                          <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="max-h-48 mx-auto object-cover rounded"
                          />
                        ) : (
                          <div>
                            <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                            <p>No cover image uploaded</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Panel>

                {/* SPEAKERS */}
                <Panel value="speakers" current={activeTab}>
                  <Card>
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
                      {formData.speakers.map((sp, idx) => {
                        const key = sp._id || sp.id || idx;
                        const idKey = sp._id || sp.id || key;

                        return (
                          <Card key={key}>
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">Speaker</h4>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeSpeaker(idKey)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-4">
                                <Avatar style={{ height: 56, width: 56 }} title={sp.name || "Speaker avatar"}>
                                  <AvatarImage
                                    src={sp.avatarUrl || ""}
                                    alt={sp.name || "Speaker"}
                                    className="object-cover rounded"
                                  />
                                  <AvatarFallback>{getInitials(sp.name)}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                  <ImageUploader
                                    label="Speaker Avatar"
                                    value={sp.avatarUrl || ""}
                                    onChange={(res) => updateSpeaker(idKey, "avatarUrl", res?.url || "")}
                                    folder="eventhive/speakers"
                                    helpText="Square images work best."
                                  />
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={sp.name || ""}
                                    onChange={(e) => updateSpeaker(idKey, "name", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={sp.title || ""}
                                    onChange={(e) => updateSpeaker(idKey, "title", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Company</Label>
                                  <Input
                                    value={sp.company || ""}
                                    onChange={(e) => updateSpeaker(idKey, "company", e.target.value)}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label>Bio</Label>
                                <Textarea
                                  value={sp.bio || ""}
                                  onChange={(e) => updateSpeaker(idKey, "bio", e.target.value)}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                </Panel>

                {/* AGENDA */}
                <Panel value="agenda" current={activeTab}>
                  <Card>
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
                      {formData.agenda.map((session, idx) => {
                        const key = session._id || session.id || idx;
                        const idKey = session._id || session.id || key;

                        return (
                          <Card key={key}>
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">Session</h4>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeSession(idKey)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={session.title || ""}
                                  onChange={(e) => updateSession(idKey, "title", e.target.value)}
                                />
                              </div>

                              <div>
                                <Label>Description</Label>
                                <Textarea
                                  value={session.description || ""}
                                  onChange={(e) => updateSession(idKey, "description", e.target.value)}
                                />
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Start</Label>
                                  <Input
                                    type="datetime-local"
                                    value={session.startDateTime || ""}
                                    onChange={(e) => updateSession(idKey, "startDateTime", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>End</Label>
                                  <Input
                                    type="datetime-local"
                                    value={session.endDateTime || ""}
                                    onChange={(e) => updateSession(idKey, "endDateTime", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Room</Label>
                                  <Input
                                    value={session.room || ""}
                                    onChange={(e) => updateSession(idKey, "room", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Track</Label>
                                  <Input
                                    value={session.track || ""}
                                    onChange={(e) => updateSession(idKey, "track", e.target.value)}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label>Speaker Names (comma-separated)</Label>
                                <Input
                                  value={session.speakerNames || ""}
                                  onChange={(e) => updateSession(idKey, "speakerNames", e.target.value)}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                </Panel>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="mt-auto px-4 py-3 md:px-6 flex gap-2 justify-end border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={updating}>
              {updating ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

