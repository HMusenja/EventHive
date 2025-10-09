// src/pages/account/EditProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
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
import SafeAvatar from "@/shared/SafeAvatar";
import TagInput from "@/components/inputs/TagInput";
import { normalizeTags } from "@/utils/tags";
import { MapPin, Briefcase, GraduationCap, Users } from "lucide-react";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public – visible to everyone" },
  { value: "connections", label: "Connections – only your connections" },
  { value: "private", label: "Private – only you" },
];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { profile, saveProfile } = useProfile();
  const { user: authUser } = useAuth();

  const [form, setForm] = useState({
    // identity
    fullName: "",
    username: "",
    email: "",
    avatar: "",
    // public profile fields
    bio: "",
    location: "",
    company: "",
    role: "",
    education: "",
    interests: [],
    skills: [],
    goals: [],
    profileVisibility: "public",
    // prefs
    locale: "",
    timezone: "",
    notificationPrefs: { email: false, reminders: false },
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync profile → form
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      fullName: profile.fullName || "",
      username: profile.username || "",
      email: profile.email || "",
      avatar: profile.avatar || "",
      bio: profile.bio || "",
      location: profile.location || profile.city || "",
      company: profile.company || "",
      role: profile.role || "",
      education: profile.education || "",
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      goals: Array.isArray(profile.goals) ? profile.goals : [],
      profileVisibility: profile.profileVisibility || "public",
      locale: profile.locale || "",
      timezone: profile.timezone || "",
      notificationPrefs: {
        email: !!profile?.notificationPrefs?.email,
        reminders: !!profile?.notificationPrefs?.reminders,
      },
    }));
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleToggle = (key) => {
    setForm((f) => ({
      ...f,
      notificationPrefs: {
        ...f.notificationPrefs,
        [key]: !f.notificationPrefs[key],
      },
    }));
  };

  const handleAvatarChange = (res) => {
    setForm((f) => ({ ...f, avatar: res?.url || "" }));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const normalizedUsername = (form.username || "").trim().toLowerCase();

      // Normalize *all* tag arrays before sending
      const { email, ...payload } = {
        ...form,
        username: normalizedUsername,
        interests: normalizeTags(form.interests),
        skills: normalizeTags(form.skills),
        goals: normalizeTags(form.goals),
      };

      // quick debug if needed
      // console.log("SAVING payload.goals:", payload.goals);

      const res = await saveProfile(payload);
      if (!res?.ok) throw new Error(res?.error || "Failed to save profile");
      navigate("/account/profile");
    } catch (e) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Public profile preview (mirrors your PublicProfile)
  const preview = useMemo(() => {
    const name = form.fullName || profile?.fullName || "User";
    return {
      name,
      avatar: form.avatar,
      location: form.location,
      company: form.company,
      role: form.role,
      education: form.education,
      bio: form.bio,
      interests: form.interests || [],
      skills: form.skills || [],
      goals: form.goals || [],
      mutualConnections: profile?.mutualConnections ?? 0,
      joinedDate: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "",
      connectionStatus: "not_connected",
      id: profile?._id || authUser?._id,
      username: form.username || profile?.username,
    };
  }, [form, profile, authUser]);

  const publicUrl = useMemo(() => {
    const slug = preview.username || preview.id || "";
    return `/u/${slug}`;
  }, [preview]);

  return (
    <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your public info & preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <ImageUploader
              label="Avatar"
              value={form.avatar}
              onChange={handleAvatarChange}
              folder="avatars"
              helpText="Recommended size: 400×400px"
            />

            {/* Name + Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      username: e.target.value.replace(/\s+/g, "-"),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Your public URL:{" "}
                  <code>
                    /u/{(form.username || "").trim().toLowerCase() || "[username]"}
                  </code>
                </p>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} disabled />
            </div>

            {/* Headline fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Role / Title</Label>
                <Input
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g., Product Manager"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company / Org</Label>
                <Input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="e.g., Acme Inc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Education */}
            <div className="grid gap-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="e.g., MBA, Stanford University"
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
                placeholder="Tell people a bit about you…"
              />
            </div>

            {/* Tags */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Interests</Label>
                <InterestsEditor
                  value={form.interests}
                  onChange={(tags) => setForm((f) => ({ ...f, interests: tags }))}
                  placeholder="e.g., ux, fintech, react"
                />
              </div>

              <TagInput
                label="Skills"
                value={form.skills}
                onChange={(tags) => setForm((f) => ({ ...f, skills: tags }))}
                placeholder="e.g., leadership, analytics"
              />

              <TagInput
                label="Goals"
                value={form.goals}
                onChange={(tags) => setForm((f) => ({ ...f, goals: tags }))}
                placeholder="e.g., mentoring, networking"
              />
            </div>

            {/* Visibility */}
            <div className="grid gap-2">
              <Label>Profile Visibility</Label>
              <div className="grid gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center justify-between rounded border p-3 cursor-pointer"
                  >
                    <span className="text-sm">{opt.label}</span>
                    <Switch
                      checked={form.profileVisibility === opt.value}
                      onCheckedChange={() =>
                        setForm((f) => ({ ...f, profileVisibility: opt.value }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Locale & Timezone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="locale">Locale</Label>
                <Input
                  id="locale"
                  name="locale"
                  value={form.locale}
                  onChange={handleChange}
                  placeholder="e.g., en"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  placeholder="e.g., Europe/Berlin"
                />
              </div>
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

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/account/profile")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Live Public Preview */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="text-center shadow-xl sticky top-6">
          <CardHeader>
            <div className="flex justify-center -mt-12 mb-2">
              <SafeAvatar
                src={preview.avatar}
                name={preview.name}
                className="h-28 w-28 border-4 border-card shadow-lg"
              />
            </div>
            <CardTitle className="text-xl">{preview.name}</CardTitle>
            {preview.location ? (
              <CardDescription className="flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                {preview.location}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {(preview.role || preview.company) && (
              <div className="space-y-1 text-sm">
                {preview.role && (
                  <div className="flex items-center gap-2 justify-center">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{preview.role}</span>
                  </div>
                )}
                {preview.company && (
                  <div className="text-muted-foreground">{preview.company}</div>
                )}
                {preview.education && (
                  <div className="flex items-center gap-2 justify-center pt-1 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{preview.education}</span>
                  </div>
                )}
              </div>
            )}
            {typeof preview.mutualConnections === "number" && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{preview.mutualConnections} mutual connections</span>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Link to={publicUrl} target="_blank" className="text-xs underline text-primary">
                View Public Profile
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips</CardTitle>
            <CardDescription className="text-sm">
              Your preview mirrors what visitors see at your public URL. Visibility rules may hide
              some fields depending on your settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
