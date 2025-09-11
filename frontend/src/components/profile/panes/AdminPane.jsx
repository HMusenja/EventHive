import ProfileHeader from "../shared/ProfileHeader";
// Admin-focused controls (moderation prefs, visibility, system notices, etc.)
export default function AdminPane({ user }) {
  return (
    <div className="space-y-8">
      <ProfileHeader title="Admin Profile" subtitle="Administrative preferences and tools." />
      {/* Add admin controls here */}
    </div>
  );
}
