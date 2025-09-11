import ProfileHeader from "../shared/ProfileHeader";
import AvatarCard from "../shared/AvatarCard";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Add organizer-specific fields (company profile, team, event settings, etc.)
export default function OrganizerPane({ user }) {
  const initials = (user?.fullName || user?.name || "U").split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase();
  return (
    <div className="space-y-8">
      <ProfileHeader title="Organizer Profile" subtitle="Manage your organizer information and event settings." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <AvatarCard name={user?.fullName || user?.name} location={user?.location} initials={initials} />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Update organizer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input placeholder="Your company / org" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input placeholder="https://…" />
                </div>
              </div>
              {/* Add more organizer-specific sections here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
