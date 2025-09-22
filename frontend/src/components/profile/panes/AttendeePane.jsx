import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Briefcase, GraduationCap, Heart } from "lucide-react";

import ProfileHeader from "../shared/ProfileHeader";
import AvatarCard from "../shared/AvatarCard";
import TagSection from "../shared/TagSection";
import { useAttendee } from "@/context/AttendeeContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import RequestMeetingButton from "@/components/meetings/RequestMeetingButton";

export default function AttendeePane({ user }) {
  const {
    state,
    attendee,
    interests,
    loadMyAttendee,
    saveMyAttendee,
    addInterest,
    removeInterestAt,
  } = useAttendee();
  const { toast } = useToast();
  const auth = useAuth();
  const meId = auth?.user?._id;
  const isMe = meId === user?._id;

  useEffect(() => {
    if (!state.initialized) loadMyAttendee();
  }, [state.initialized, loadMyAttendee]);

  const view = useMemo(() => {
    const name = user?.fullName || user?.name || "";
    const email = user?.email || "";
    return {
      name,
      email,
      bio: attendee?.bio || "",
      location: attendee?.location || "",
      avatar: attendee?.avatar || "",
      role: attendee?.role || "",
      company: attendee?.company || "",
      education: attendee?.education || "",
      interests: interests || [],
    };
  }, [user, attendee, interests]);

  const initials = useMemo(() => {
    const n = (view.name || "").trim();
    return n
      ? n
          .split(" ")
          .map((x) => x[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";
  }, [view.name]);

  // ---------- Local draft + debounced save (onBlur) ----------
  const [draft, setDraft] = useState({
    bio: view.bio,
    location: view.location,
    education: view.education,
  });

  // keep draft in sync when attendee loads/changes
  useEffect(() => {
    setDraft({
      bio: view.bio,
      location: view.location,
      education: view.education,
    });
  }, [view.bio, view.location, view.education]);

  function useDebounce(fn, delay = 600) {
    const t = useRef();
    return useCallback(
      (...args) => {
        clearTimeout(t.current);
        t.current = setTimeout(() => fn(...args), delay);
      },
      [fn, delay]
    );
  }

  const debouncedSave = useDebounce(async (patch) => {
    try {
      await saveMyAttendee(patch);
    } catch (err) {
      // optional: surface server-side validation
      const data = err?.response?.data;
      console.warn("[AttendeePane] save error:", data);
      if (data?.details) {
        // Mongoose-style: details = { bio: { message }, interests: { message }, ... }
        Object.entries(data.details).forEach(([path, info]) => {
          console.warn(`Invalid "${path}":`, info?.message);
        });
      }
    }
  }, 600);

  const handleBlurSave = (key) => {
    const val = draft[key];
    debouncedSave({ [key]: val });
  };

  const onSave = async () => {
    try {
      await saveMyAttendee({
        bio: draft.bio,
        location: draft.location,
        education: draft.education,
        interests: view.interests,
      });
      toast({
        title: "Profile saved",
        description: "Your attendee profile is up to date.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onAdd = useCallback(
    (field, v) => field === "interests" && addInterest(v, 10),
    [addInterest]
  );
  const onRemoveAt = useCallback(
    (field, i) => field === "interests" && removeInterestAt(i),
    [removeInterestAt]
  );

  return (
    <div className="space-y-8">
      <ProfileHeader
        title="My Attendee Profile"
        subtitle="Tell others about yourself and choose interests for better matches."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <AvatarCard
            name={view.name}
            location={draft.location}
            avatarUrl={view.avatar}
            initials={initials}
            extras={
              <>
                {(view.role || view.company) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>
                      {[view.role, view.company].filter(Boolean).join(" at ")}
                    </span>
                  </div>
                )}
                {draft.education && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{draft.education}</span>
                  </div>
                )}
                <Separator />
                <p className="text-sm text-left">

                  {view.bio || "Write a short bio so people can discover you."}

                </p>
              </>
            }
          />

          {/* ✅ valid: conditional JSX after the component, not inside its props */}
          {!isMe && (
            <div className="mt-3">
              <RequestMeetingButton hostId={user._id} eventId={null} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your attendee profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={view.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={view.email} readOnly />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={draft.location}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, location: e.target.value }))
                    }
                    // onBlur={undifined}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Education (optional)</Label>
                  <Input
                    value={draft.education}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, education: e.target.value }))
                    }
                    // onBlur={undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  rows={4}
                  value={draft.bio}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, bio: e.target.value }))
                  }
                  // onBlur={undefined}
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={state.saving}
                onClick={onSave}
              >
                {state.saving ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TagSection
          title="Interests"
          items={view.interests}
          field="interests"
          placeholder="Add an interest…"
          icon={Heart}
          color="primary"
          helperText="Choose up to 10 topics to improve your matchmaking."
          onAdd={onAdd}
          onRemoveAt={onRemoveAt}
        />
      </div>
    </div>
  );
}
