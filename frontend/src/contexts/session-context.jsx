import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNavigationBySession } from "@/lib/navigation";
import { getSession, logout } from "@/services/auth";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  const navigation = useMemo(
    () => getNavigationBySession(user),
    [user],
  );

  const userName = user?.name?.trim() || "Equipe AMA";

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const data = await getSession();
        if (!mounted) {
          return;
        }
        setUser(data?.user ?? null);
      } catch {
        if (!mounted) {
          return;
        }
        navigate("/login", { replace: true });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleLogout() {
    setError("");
    setLeaving(true);
    try {
      await logout();
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
    loading,
    leaving,
    error,
    setError,
    sidebarItems: navigation.sidebarItems,
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
