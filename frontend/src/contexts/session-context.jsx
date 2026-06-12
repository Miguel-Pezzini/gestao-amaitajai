import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearStoredUser,
  normalizeAuthUser,
  persistUser,
  readStoredToken,
  readStoredUser,
} from "@/lib/auth-session";
import { isBearerAuth } from "@/lib/auth-transport";
import { getNavigationBySession } from "@/lib/navigation";
import { getSession, logout } from "@/services/auth";
import { registerUnauthorizedHandler } from "@/services/api";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUserState] = useState(() => readStoredUser());
  const [hydrating, setHydrating] = useState(() => readStoredUser() === null);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  const navigation = useMemo(
    () => getNavigationBySession(user),
    [user],
  );

  const userName = user?.name?.trim() || "Equipe AMA";

  function setUser(nextUser) {
    const normalized = normalizeAuthUser(nextUser);
    setUserState(normalized);
    if (normalized) {
      persistUser(normalized);
      return;
    }
    clearStoredUser();
  }

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUserState(null);
      navigate("/login", { replace: true });
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [navigate]);

  useEffect(() => {
    const storedUser = readStoredUser();
    const storedToken = readStoredToken();

    if (storedUser && (!isBearerAuth() || storedToken)) {
      setHydrating(false);
      return;
    }

    if (isBearerAuth() && !storedToken) {
      setHydrating(false);
      return;
    }

    let mounted = true;

    async function hydrateSession() {
      try {
        const data = await getSession();
        if (!mounted) {
          return;
        }
        const normalized = normalizeAuthUser(data?.user);
        if (normalized) {
          setUserState(normalized);
          persistUser(normalized);
        }
      } catch {
        // Sessão inválida: o interceptor global trata 401 nas demais rotas.
      } finally {
        if (mounted) {
          setHydrating(false);
        }
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    setError("");
    setLeaving(true);
    try {
      await logout();
      setUser(null);
      navigate("/login", { replace: true });
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setLeaving(false);
    }
  }

  const value = {
    user,
    userName,
    hydrating,
    leaving,
    error,
    setError,
    setUser,
    sidebarItems: navigation.sidebarItems,
    sidebarGroups: navigation.sidebarGroups,
    quickAccessItems: navigation.quickAccessItems,
    logout: handleLogout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession deve ser usado dentro de SessionProvider.");
  }
  return context;
}
