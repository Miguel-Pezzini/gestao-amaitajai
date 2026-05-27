import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CADASTRO_ITEMS } from "@/config/cadastros";
import { APP_MODULES } from "@/config/modules";

export function ModuleComingSoonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleId } = useParams();

  const moduleData = useMemo(() => {
    if (moduleId) {
      return APP_MODULES.find((item) => item.id === moduleId);
    }
    return (
      APP_MODULES.find((item) => item.route === location.pathname) ??
      CADASTRO_ITEMS.find((item) => item.route === location.pathname)
    );
  }, [location.pathname, moduleId]);

  return (
    <Card className="border-ama-cyan/30">
      <CardHeader>
        <Badge variant="secondary" className="w-fit bg-ama-light text-ama-blue-dark">
          Em desenvolvimento
        </Badge>
        <CardTitle className="text-2xl text-ama-blue-dark">
          {moduleData?.label ?? "Módulo"}
        </CardTitle>
        <CardDescription>
          {moduleData?.description ??
            "Este módulo ainda não está disponível nesta etapa do MVP."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={() => navigate("/")}>Voltar para Home</Button>
        <Button
          variant="outline"
          className="border-ama-cyan text-ama-blue hover:bg-ama-light"
          onClick={() => navigate("/patients")}
        >
          Ir para Pacientes
        </Button>
      </CardContent>
    </Card>
  );
}
