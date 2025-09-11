import { Suspense, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import AttendeePane from "@/components/profile/panes/AttendeePane";
import OrganizerPane from "@/components/profile/panes/OrganizerPane";
import AdminPane from "@/components/profile/panes/AdminPane";
import UserPane from "@/components/profile/panes/UserPane";

export default function Profile() {
  const { user } = useAuth(); // { role, fullName/name, email, ... }
  const role = (user?.role || "user").toLowerCase();

  const Pane = useMemo(() => {
    if (role === "admin") return AdminPane;
    if (role === "organizer") return OrganizerPane;
    // default to Attendee for "user", missing, or unknown roles
    return AttendeePane;
  }, [role]);

  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading profile…</div>}>
      <Pane user={user} />
    </Suspense>
  );
}
