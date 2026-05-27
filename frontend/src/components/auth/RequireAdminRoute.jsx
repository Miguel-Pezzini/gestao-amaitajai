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
  const { user, loading } = useSession();

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando permissões...</p>
    );
  }

  if (getUserRole(user) !== "administrador") {
    return <Navigate to="/" replace />;
  }

  return children;
}
