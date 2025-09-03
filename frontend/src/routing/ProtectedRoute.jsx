// src/routing/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import CenterSpinner from "@/components/common/CenterSpinner";

export default function ProtectedRoute({ children }) {
  const { initialized, user } = useAuth();
  const location = useLocation();

  // Wait until first /auth/me finishes to avoid flicker
  if (!initialized) return <CenterSpinner />;

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}
