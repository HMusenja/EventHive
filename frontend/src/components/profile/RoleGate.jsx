import { useAuth } from "@/context/AuthContext";
export default function RoleGate({ allow = [], children, fallback = null }) {
  const { user } = useAuth();
  if (!allow.length) return children;
  return allow.includes(user?.role) ? children : fallback;
}
