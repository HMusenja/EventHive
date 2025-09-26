// src/pages/account/Profile.jsx
import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, CalendarDays } from "lucide-react";

import MyOrganizingGrid from "@/components/event/MyOrganizingGrid";

function RoleList({ items = [], label = "Open" }) {
  if (!items.length)
    return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;
  return (
    <div className="grid gap-3">
      {items.map((e) => (
        <Card key={e.eventId}>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{e.title}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {e.startAt && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(e.startAt).toLocaleString()}
                  </span>
                )}
                {e.status && <Badge variant="outline">{e.status}</Badge>}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = `/events/${e.slug}`)}
            >
              {label}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    profile,
    memberships,
    nextOrganizing,
    hasAnyEventRole,
    isOrganizer,
    saveProfile,
    reload,
  } = useProfile();
  const [editOpen, setEditOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-4">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-6">
            <p className="text-red-600">Failed to load: {error}</p>
            <Button className="mt-3" onClick={reload}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const organizerCount = memberships?.counts?.organizer || 0;

  return (
    <div className="container max-w-5xl mx-auto p-4 space-y-6">
      {/* Identity */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Manage your identity & preferences
            </CardDescription>
          </div>
          <Button onClick={() => navigate("/account/profile/edit")}>
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {profile?.avatar && (
              <AvatarImage src={profile.avatar} alt={profile.fullName} />
            )}
            <AvatarFallback>{profile?.fullName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="font-semibold text-lg">{profile?.fullName}</p>
            <p className="text-sm text-muted-foreground">
              @{profile?.username}
            </p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Bio & interests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {profile?.bio || (
              <span className="text-muted-foreground">No bio yet</span>
            )}
          </p>
          {Array.isArray(profile?.interests) &&
            profile.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full bg-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Locale, timezone, notifications</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="font-medium">Locale:</span>{" "}
            <span className="text-muted-foreground">{profile?.locale}</span>
          </div>
          <div>
            <span className="font-medium">Timezone:</span>{" "}
            <span className="text-muted-foreground">{profile?.timezone}</span>
          </div>
          <div>
            <span className="font-medium">Email alerts:</span>{" "}
            <span className="text-muted-foreground">
              {profile?.notificationPrefs?.email ? "On" : "Off"}
            </span>
          </div>
          <div>
            <span className="font-medium">Reminders:</span>{" "}
            <span className="text-muted-foreground">
              {profile?.notificationPrefs?.reminders ? "On" : "Off"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Events (conditional) */}
      {hasAnyEventRole && (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>
                Quick access based on your roles
              </CardDescription>
            </div>
            {isOrganizer ? (
              <div className="flex items-center gap-3">
                <Badge>Organizer: {organizerCount}</Badge>
                <Button onClick={() => navigate("/dashboard/organizer")}>
                  Open Organizer Dashboard
                </Button>
              </div>
            ) : (
              <Badge variant="outline">No organizer events</Badge>
            )}
          </CardHeader>
          <CardContent>
            {isOrganizer && nextOrganizing && (
              <div className="mb-4 rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Next you organize: {nextOrganizing.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <CalendarDays className="inline h-4 w-4 mr-1" />
                    {new Date(nextOrganizing.startAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/dashboard/organizer")}
                >
                  Manage
                </Button>
              </div>
            )}

            <Tabs defaultValue="organizing">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="organizing">Organizing</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="speaker">Speaker</TabsTrigger>
                <TabsTrigger value="attending">Attending</TabsTrigger>
              </TabsList>

              <TabsContent value="organizing" className="pt-4">
                <MyOrganizingGrid />
              </TabsContent>
              <TabsContent value="staff" className="pt-4">
                <RoleList items={memberships.staff} label="Open" />
              </TabsContent>
              <TabsContent value="speaker" className="pt-4">
                <RoleList items={memberships.speaker} label="Open" />
              </TabsContent>
              <TabsContent value="attending" className="pt-4">
                <RoleList items={memberships.attending} label="View" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
