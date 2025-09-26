import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/media/ImageUploader";
import InterestsEditor from "@/components/profile/InterestsEditor";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { profile, saveProfile, reload } = useProfile();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
    locale: "",
    timezone: "",
    notificationPrefs: { email: false, reminders: false },
    avatar: "",
    interests: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync profile into form
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || "",
        username: profile.username || "",
        email: profile.email || "",
        bio: profile.bio || "",
        locale: profile.locale || "",
        timezone: profile.timezone || "",
        notificationPrefs: {
          email: profile.notificationPrefs?.email || false,
          reminders: profile.notificationPrefs?.reminders || false,
        },
        avatar: profile.avatar || "",
        interests: Array.isArray(profile.interests) ? profile.interests : [],
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleToggle = (key) => {
    setForm({
      ...form,
      notificationPrefs: {
        ...form.notificationPrefs,
        [key]: !form.notificationPrefs[key],
      },
    });
  };

  const handleAvatarChange = (res) => {
    setForm({ ...form, avatar: res?.url || "" });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { email, ...rest } = form; // ⬅️ do not send email
      const res = await saveProfile(rest);
      if (!res.ok) throw new Error(res.error || "Failed to save profile");
      navigate("/account/profile"); // ✅ redirect back to profile page
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your identity & preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <ImageUploader
            label="Avatar"
            value={form.avatar}
            onChange={handleAvatarChange}
            folder="avatars"
            helpText="Recommended size: 400x400px"
          />

          {/* Full Name */}
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              disabled
            />
          </div>

          {/* Bio */}
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
          {/* Interests (user-scoped) */}
          <div className="grid gap-2">
            <Label>Interests</Label>
            <InterestsEditor
              value={form.interests}
              onChange={(tags) => setForm({ ...form, interests: tags })}
            />
            <p className="text-xs text-muted-foreground">
              Add topics that describe you (e.g., “react”, “fintech”, “design
              ops”).
            </p>
          </div>

          {/* Locale */}
          <div className="grid gap-2">
            <Label htmlFor="locale">Locale</Label>
            <Input
              id="locale"
              name="locale"
              value={form.locale}
              onChange={handleChange}
            />
          </div>

          {/* Timezone */}
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
            />
          </div>

          {/* Notifications */}
          <div className="grid gap-2">
            <Label>Notifications</Label>
            <div className="flex items-center justify-between">
              <span>Email alerts</span>
              <Switch
                checked={form.notificationPrefs.email}
                onCheckedChange={() => handleToggle("email")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Reminders</span>
              <Switch
                checked={form.notificationPrefs.reminders}
                onCheckedChange={() => handleToggle("reminders")}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => navigate("/account/profile")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
