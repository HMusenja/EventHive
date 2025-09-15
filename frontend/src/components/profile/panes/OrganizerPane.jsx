import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "../shared/ProfileHeader";
import AvatarCard from "../shared/AvatarCard";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMyOrganizing, updateOrganizerProfile } from "@/api/eventsApi";

export default function OrganizerPane({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  // Organizer details come from event.organizerProfile
  const [orgDetails, setOrgDetails] = useState({
    organizationName: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);

  const initials = (user?.fullName || user?.name || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventData = await getMyOrganizing();
        setEvents(eventData || []);

        if (eventData?.length > 0) {
          const profile = eventData[0].organizerProfile || {};
          setOrgDetails({
            organizationName: profile.name || "",
            website: profile.website || "",
          });
        }
      } catch (err) {
        console.error("[OrganizerPane] error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setOrgDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!events[0]?._id) return;
    setSaving(true);
    try {
      await updateOrganizerProfile(events[0]._id, {
        name: orgDetails.organizationName,
        website: orgDetails.website,
      });
      console.debug("[OrganizerPane] profile updated:", orgDetails);
    } catch (err) {
      console.error("[OrganizerPane] error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-8">
      <ProfileHeader
        title="Organizer Profile"
        subtitle="Manage your organizer information and event settings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AvatarCard
            name={user?.fullName || user?.name}
            location={user?.location}
            initials={initials}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organizer details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Update organizer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={orgDetails.organizationName}
                    onChange={(e) =>
                      handleChange("organizationName", e.target.value)
                    }
                    placeholder="Your company / org"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={orgDetails.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Events list */}
          <Card>
            <CardHeader>
              <CardTitle>My Events</CardTitle>
              <CardDescription>
                These are the events you’re organizing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground">
                  You don’t have any events yet. Create one to get started.
                </p>
              ) : (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li key={event._id} className="border-b pb-2">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.startAt).toLocaleDateString()} •{" "}
                        {event.venue?.city || "Online"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Dashboard button */}
          {events.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={() => navigate("/dashboard/organizer")}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                Go to Organizer Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


