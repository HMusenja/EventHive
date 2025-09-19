import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Trash2, Upload, Image } from 'lucide-react';

export default function CreateEventModal({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    coverImage: '',
    title: '',
    subtitle: '',
    slug: '',
    description: '',
    visibility: 'public',
    onboardingEnabled: true,
    capacity: 0,
    startDateTime: '',
    endDateTime: '',
    timezone: 'Europe/Berlin',
    venueName: '',
    venueAddress: '',
    venueCity: '',
    venueCountry: '',
    venueLatitude: '',
    venueLongitude: '',
    mapEmbedUrl: '',
    organizerName: '',
    organizerWebsite: '',
    organizerBio: '',
    organizerAvatar: '',
    organizerTwitter: '',
    organizerLinkedIn: '',
    organizerGitHub: '',
    organizerWebsiteUrl: '',
    speakers: [],
    agenda: []
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    updateFormData('title', title);
    if (!formData.slug) {
      updateFormData('slug', generateSlug(title));
    }
  };

  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, {
        id: Date.now(),
        name: '',
        title: '',
        company: '',
        bio: '',
        avatarUrl: ''
      }]
    }));
  };

  const removeSpeaker = (id) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter(speaker => speaker.id !== id)
    }));
  };

  const updateSpeaker = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.map(speaker =>
        speaker.id === id ? { ...speaker, [field]: value } : speaker
      )
    }));
  };

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      agenda: [...prev.agenda, {
        id: Date.now(),
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        room: '',
        track: '',
        speakerNames: ''
      }]
    }));
  };

  const removeSession = (id) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter(session => session.id !== id)
    }));
  };

  const updateSession = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.map(session =>
        session.id === id ? { ...session, [field]: value } : session
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Creating event:', formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload via Cloudinary
                </Button>
              </div>
              <div>
                <Label htmlFor="coverImageUrl">Image URL</Label>
                <Input
                  id="coverImageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={formData.coverImage}
                  onChange={(e) => updateFormData('coverImage', e.target.value)}
                />
              </div>
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                {formData.coverImage ? (
                  <img src={formData.coverImage} alt="Cover preview" className="max-h-48 mx-auto rounded" />
                ) : (
                  <div className="text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-2" />
                    <p>Cover image preview</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basics */}
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  required
                  placeholder="Event title"
                  value={formData.title}
                  onChange={handleTitleChange}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  placeholder="Event subtitle"
                  value={formData.subtitle}
                  onChange={(e) => updateFormData('subtitle', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="event-slug"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Event description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(value) => updateFormData('visibility', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  onCheckedChange={(checked) => updateFormData('onboardingEnabled', checked)}
                />
                <Label htmlFor="onboarding">Onboarding Enabled</Label>
              </div>
              <div>
                <Label htmlFor="capacity">Capacity (0 for unlimited)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => updateFormData('capacity', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startDateTime">Start Date/Time *</Label>
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  required
                  value={formData.startDateTime}
                  onChange={(e) => updateFormData('startDateTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDateTime">End Date/Time *</Label>
                <Input
                  id="endDateTime"
                  type="datetime-local"
                  required
                  value={formData.endDateTime}
                  onChange={(e) => updateFormData('endDateTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="Europe/Berlin"
                  value={formData.timezone}
                  onChange={(e) => updateFormData('timezone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Venue */}
          <Card>
            <CardHeader>
              <CardTitle>Venue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venueName">Name</Label>
                  <Input
                    id="venueName"
                    placeholder="Venue name"
                    value={formData.venueName}
                    onChange={(e) => updateFormData('venueName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="venueAddress">Address</Label>
                  <Input
                    id="venueAddress"
                    placeholder="Street address"
                    value={formData.venueAddress}
                    onChange={(e) => updateFormData('venueAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="venueCity">City</Label>
                  <Input
                    id="venueCity"
                    placeholder="City"
                    value={formData.venueCity}
                    onChange={(e) => updateFormData('venueCity', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="venueCountry">Country</Label>
                  <Input
                    id="venueCountry"
                    placeholder="Country"
                    value={formData.venueCountry}
                    onChange={(e) => updateFormData('venueCountry', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="venueLatitude">Latitude</Label>
                  <Input
                    id="venueLatitude"
                    type="number"
                    step="any"
                    placeholder="52.520008"
                    value={formData.venueLatitude}
                    onChange={(e) => updateFormData('venueLatitude', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="venueLongitude">Longitude</Label>
                  <Input
                    id="venueLongitude"
                    type="number"
                    step="any"
                    placeholder="13.404954"
                    value={formData.venueLongitude}
                    onChange={(e) => updateFormData('venueLongitude', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mapEmbedUrl">Map Embed URL</Label>
                <Input
                  id="mapEmbedUrl"
                  placeholder="https://maps.google.com/embed..."
                  value={formData.mapEmbedUrl}
                  onChange={(e) => updateFormData('mapEmbedUrl', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Organizer Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organizerName">Name *</Label>
                <Input
                  id="organizerName"
                  required
                  placeholder="Organizer name"
                  value={formData.organizerName}
                  onChange={(e) => updateFormData('organizerName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="organizerWebsite">Website</Label>
                <Input
                  id="organizerWebsite"
                  placeholder="https://example.com"
                  value={formData.organizerWebsite}
                  onChange={(e) => updateFormData('organizerWebsite', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="organizerBio">Bio</Label>
                <Textarea
                  id="organizerBio"
                  placeholder="Organizer bio"
                  value={formData.organizerBio}
                  onChange={(e) => updateFormData('organizerBio', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="organizerAvatar">Avatar URL</Label>
                <Input
                  id="organizerAvatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.organizerAvatar}
                  onChange={(e) => updateFormData('organizerAvatar', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizerTwitter">Twitter</Label>
                  <Input
                    id="organizerTwitter"
                    placeholder="@username"
                    value={formData.organizerTwitter}
                    onChange={(e) => updateFormData('organizerTwitter', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="organizerLinkedIn">LinkedIn</Label>
                  <Input
                    id="organizerLinkedIn"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.organizerLinkedIn}
                    onChange={(e) => updateFormData('organizerLinkedIn', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="organizerGitHub">GitHub</Label>
                  <Input
                    id="organizerGitHub"
                    placeholder="https://github.com/username"
                    value={formData.organizerGitHub}
                    onChange={(e) => updateFormData('organizerGitHub', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="organizerWebsiteUrl">Website</Label>
                  <Input
                    id="organizerWebsiteUrl"
                    placeholder="https://example.com"
                    value={formData.organizerWebsiteUrl}
                    onChange={(e) => updateFormData('organizerWebsiteUrl', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speakers */}
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
              {formData.speakers.map((speaker) => (
                <Card key={speaker.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Speaker</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpeaker(speaker.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          required
                          placeholder="Speaker name"
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(speaker.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          placeholder="Job title"
                          value={speaker.title}
                          onChange={(e) => updateSpeaker(speaker.id, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          placeholder="Company"
                          value={speaker.company}
                          onChange={(e) => updateSpeaker(speaker.id, 'company', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Avatar URL</Label>
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          value={speaker.avatarUrl}
                          onChange={(e) => updateSpeaker(speaker.id, 'avatarUrl', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Bio</Label>
                      <Textarea
                        placeholder="Speaker bio"
                        value={speaker.bio}
                        onChange={(e) => updateSpeaker(speaker.id, 'bio', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Agenda */}
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
              {formData.agenda.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-secondary">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Session</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSession(session.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          required
                          placeholder="Session title"
                          value={session.title}
                          onChange={(e) => updateSession(session.id, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Session description"
                          value={session.description}
                          onChange={(e) => updateSession(session.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Start Date/Time *</Label>
                          <Input
                            type="datetime-local"
                            required
                            value={session.startDateTime}
                            onChange={(e) => updateSession(session.id, 'startDateTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>End Date/Time *</Label>
                          <Input
                            type="datetime-local"
                            required
                            value={session.endDateTime}
                            onChange={(e) => updateSession(session.id, 'endDateTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Room</Label>
                          <Input
                            placeholder="Room name"
                            value={session.room}
                            onChange={(e) => updateSession(session.id, 'room', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Track</Label>
                          <Input
                            placeholder="Track name"
                            value={session.track}
                            onChange={(e) => updateSession(session.id, 'track', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Speaker Names (comma-separated)</Label>
                        <Input
                          placeholder="John Doe, Jane Smith"
                          value={session.speakerNames}
                          onChange={(e) => updateSession(session.id, 'speakerNames', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}