import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/session-context";
import { normalizeRole } from "@/features/agenda/utils";

const SALES_ROLES = ["ADMINISTRADOR", "OPERADOR"];

export function RequireSalesRoute({ children }) {
  const { user, hydrating } = useSession();
  const userRole = normalizeRole(user?.role);

  if (hydrating) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!SALES_ROLES.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
