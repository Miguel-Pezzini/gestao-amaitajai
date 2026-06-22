import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/contexts/session-context";
import { normalizeRole } from "@/features/agenda/utils";

export function HomePage() {
  const navigate = useNavigate();
  const { userName, quickAccessItems, user } = useSession();

  useEffect(() => {
    if (normalizeRole(user?.role) === "OPERADOR") {
      navigate("/vendas", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="space-y-6">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-4">
          <CardTitle className="text-xl tracking-tight text-ama-text">
            Olá, {userName}
          </CardTitle>
          <CardDescription className="max-w-3xl">
            Bem-vindo(a) ao painel inicial do sistema de gestão institucional.
          </CardDescription>
        </CardHeader>
      </Card>

      <div>        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg text-ama-text">Acessos rápidos</CardTitle>
        </CardHeader>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {quickAccessItems.map((module) => (
            <Card
              key={module.id}
              className="border-ama-cyan/30 transition hover:border-ama-cyan"
            >
              <CardHeader className="p-5">
                <CardTitle className="text-base text-ama-blue-dark">{module.label}</CardTitle>
                <CardDescription className="mt-1">{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <Button
                  variant={module.enabled ? "default" : "outline"}
                  className={
                    module.enabled
                      ? "bg-ama-blue text-white hover:bg-ama-blue-dark"
                      : "border-ama-cyan text-ama-blue hover:bg-ama-light"
                  }
                  onClick={() => navigate(module.route)}
                >
                  {module.enabled ? "Abrir módulo" : "Ver detalhes"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
