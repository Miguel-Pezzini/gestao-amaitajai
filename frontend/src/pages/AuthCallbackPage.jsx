import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/session-context";
import { persistToken } from "@/lib/auth-session";
import { getSession } from "@/services/auth";

function readTokenFromHash() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) {
    return null;
  }

  return new URLSearchParams(hash).get("token");
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function completeOAuthLogin() {
      const token = readTokenFromHash();
      window.history.replaceState(null, "", window.location.pathname);

      if (!token) {
        if (mounted) {
          navigate("/login?error=google_auth_falhou", { replace: true });
        }
        return;
      }

      persistToken(token);

      try {
        const data = await getSession();
        if (!mounted) {
          return;
        }
        setUser(data?.user ?? null);
        navigate("/", { replace: true });
      } catch {
        if (mounted) {
          setError("Não foi possível concluir o login. Tente novamente.");
        }
      }
    }

    completeOAuthLogin();

    return () => {
      mounted = false;
    };
  }, [navigate, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ama-light px-6">
      <p className="text-sm text-muted-foreground">
        {error || "Concluindo login..."}
      </p>
    </main>
  );
}
