import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/session-context";

function getUserRole(user) {
  const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
  if (normalizedRole === "admin") {
    return "administrador";
  }
  return normalizedRole;
}

export function RequireAdminRoute({ children }) {
  const { user } = useSession();

  if (getUserRole(user) !== "administrador") {
    return <Navigate to="/" replace />;
  }

  return children;
}
