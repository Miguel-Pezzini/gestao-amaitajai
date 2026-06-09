import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/session-context";

function getUserRole(user) {
  const normalizedRole = String(user?.role ?? "").trim().toUpperCase();
  if (normalizedRole === "ADMIN") {
    return "ADMINISTRADOR";
  }
  return normalizedRole;
}

export function RequireAdminRoute({ children }) {
  const { user } = useSession();

  if (getUserRole(user) !== "ADMINISTRADOR") {
    return <Navigate to="/" replace />;
  }

  return children;
}
