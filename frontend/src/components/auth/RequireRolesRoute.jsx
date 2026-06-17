import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/session-context";
import { normalizeRole } from "@/features/agenda/utils";

export function RequireRolesRoute({ roles, children }) {
  const { user } = useSession();
  const userRole = normalizeRole(user?.role);

  if (!roles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
