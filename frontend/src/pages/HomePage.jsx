import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, logout } from "@/services/auth";

const modules = [
  {
    title: "Atendimentos",
    description: "Acompanhe agenda, evolução e histórico dos assistidos.",
  },
  {
    title: "Profissionais",
    description: "Gerencie equipes, escalas internas e dados cadastrais.",
  },
  {
    title: "Relatórios",
    description: "Visualize indicadores para apoiar decisões institucionais.",
  },
  {
    title: "Comunicação",
    description: "Organize avisos e alinhamentos entre setores da AMA.",
  },
];

const quickStats = [
  { label: "Atendimentos hoje", value: "12" },
  { label: "Profissionais em atividade", value: "18" },
  { label: "Pendências administrativas", value: "5" },
];

const sidebarMenu = [
  "Visão geral",
  "Atendimentos",
  "Profissionais",
  "Relatórios",
  "Configurações",
];

export function HomePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Equipe AMA");
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const data = await getSession();
        if (!mounted) {
          return;
        }
        const name = data?.user?.name?.trim();
        setUserName(name || "Equipe AMA");
      } catch {
        if (!mounted) {
          return;
        }
        navigate("/login", { replace: true });
      } finally {
        if (mounted) {
          setLoadingSession(false);
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

  if (loadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ama-light px-6">
        <p className="text-sm text-muted-foreground">Carregando painel...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-ama-light">
      <aside className="hidden w-72 flex-col border-r border-ama-cyan/30 bg-ama-blue-dark px-5 py-6 text-white lg:flex">
        <Card className="border-white/20 bg-white/10 text-white shadow-none">
          <CardHeader className="p-4">
            <CardDescription className="text-xs font-semibold tracking-wide text-ama-cyan uppercase">
              Gestão interna
            </CardDescription>
            <CardTitle className="text-2xl tracking-tight">AMA Itajaí</CardTitle>
          </CardHeader>
        </Card>

        <nav className="mt-8 flex-1 space-y-2">
          {sidebarMenu.map((item, index) => (
            <Button
              key={item}
              variant="ghost"
              className={`h-10 w-full justify-start text-left text-sm ${
                index === 0
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item}
            </Button>
          ))}
        </nav>

        <Button
          onClick={handleLogout}
          className="mt-6 w-full bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
          disabled={leaving}
        >
          {leaving ? "Saindo..." : "Sair do sistema"}
        </Button>
      </aside>

      <section className="flex-1 px-6 py-6 md:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Card className="border-ama-cyan/30">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-3 bg-ama-light text-ama-blue-dark lg:hidden"
                  >
                    Gestão interna
                  </Badge>
                  <CardTitle className="text-xl tracking-tight text-ama-text">
                    Olá, {userName}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-3xl">
                    Bem-vindo(a) ao painel inicial do sistema de gestão
                    institucional.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleLogout}
                  className="bg-ama-blue text-white hover:bg-ama-blue-dark lg:hidden"
                  disabled={leaving}
                >
                  {leaving ? "Saindo..." : "Sair"}
                </Button>
              </div>
            </CardHeader>
            {error ? (
              <CardContent>
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              </CardContent>
            ) : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {quickStats.map((item) => (
              <Card key={item.label} className="border-ama-cyan/30">
                <CardHeader className="gap-2 p-5">
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-2xl text-ama-blue-dark">
                    {item.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg text-ama-text">Acessos rápidos</CardTitle>
            </CardHeader>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {modules.map((module) => (
                <Card
                  key={module.title}
                  className="border-ama-cyan/30 transition hover:border-ama-cyan"
                >
                  <CardHeader className="p-5">
                    <CardTitle className="text-base text-ama-blue-dark">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <Badge variant="outline" className="border-ama-cyan text-ama-blue">
                      Em breve
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
