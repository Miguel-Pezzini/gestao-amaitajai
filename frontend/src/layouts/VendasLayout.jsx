import { NavLink, Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { VENDAS_MODULES } from "@/config/vendas-modules";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/contexts/session-context";
import { normalizeRole } from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

export function VendasSubNav() {
  const userRole = normalizeRole(useSession().user?.role);
  const isAdmin = userRole === "ADMINISTRADOR";

  const items = VENDAS_MODULES.filter(
    (item) => item.enabled && (!item.adminOnly || isAdmin),
  ).sort((a, b) => a.order - b.order);

  return (
    <nav className="flex flex-wrap gap-2 border-b border-ama-cyan/30 pb-3">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.route}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-ama-blue text-white"
                : "bg-white text-ama-text hover:bg-ama-light",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function VendasLayout() {
  const { userName, logout, leaving } = useSession();
  const userRole = normalizeRole(useSession().user?.role);
  const isAdmin = userRole === "ADMINISTRADOR";

  const items = VENDAS_MODULES.filter(
    (item) => item.enabled && (!item.adminOnly || isAdmin),
  ).sort((a, b) => a.order - b.order);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 lg:min-h-[calc(100vh-2rem)] lg:flex-row">
      <aside className="w-full shrink-0 rounded-xl border border-ama-cyan/30 bg-ama-blue-dark p-4 text-white lg:w-64">
        <Card className="border-white/20 bg-white/10 text-white shadow-none">
          <CardHeader className="p-4">
            <CardDescription className="text-xs font-semibold tracking-wide text-ama-cyan uppercase">
              Vendas AMA
            </CardDescription>
            <CardTitle className="text-lg">Cantina / Eventos</CardTitle>
          </CardHeader>
        </Card>

        <p className="mt-4 text-sm text-white/80">{userName}</p>

        <nav className="mt-6 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.route}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-ama-cyan text-ama-blue-dark"
                      : "text-white/90 hover:bg-white/10",
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <Button
          type="button"
          onClick={logout}
          disabled={leaving}
          className="mt-6 w-full bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
        >
          <LogOut className="mr-2 size-4" aria-hidden="true" />
          {leaving ? "Saindo..." : "Sair"}
        </Button>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export function VendasSection() {
  const userRole = normalizeRole(useSession().user?.role);
  const isOperador = userRole === "OPERADOR";

  if (isOperador) {
    return <Outlet />;
  }

  return (
    <div className="space-y-4">
      <VendasSubNav />
      <Outlet />
    </div>
  );
}
