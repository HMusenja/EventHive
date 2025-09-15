export function getDashboardPath(user) {
  console.debug("[getDashboardPath] user role:", user?.role, "isOrganizer:", user?.isOrganizer);
  if (!user) return "/account/profile";
  const role = (user.role || "user").toLowerCase();
  if (role === "admin") return "/admin/dashboard";
  if (role === "organizer" || user?.isOrganizer) return "/organizer/dashboard";
  return "/account/profile";
}

