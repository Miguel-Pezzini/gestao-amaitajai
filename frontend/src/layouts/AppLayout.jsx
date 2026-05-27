import { useEffect, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Outlet } from "react-router-dom";
import { AppMobileNav, AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/contexts/session-context";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "ama-sidebar-expanded";

function readSidebarExpanded() {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === null) {
      return true;
    }
    return stored === "true";
  } catch {
    return true;
  }
}

export function AppLayout() {
  const { loading, leaving, error, sidebarItems, sidebarGroups, logout } = useSession();
  const [sidebarExpanded, setSidebarExpanded] = useState(readSidebarExpanded);
  const [mobileCadastrosOpen, setMobileCadastrosOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarExpanded));
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }, [sidebarExpanded]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ama-light px-6">
        <p className="text-sm text-muted-foreground">Carregando painel...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-ama-light">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col overflow-y-auto border-r border-ama-cyan/30 bg-ama-blue-dark py-6 text-white transition-[width,padding] duration-300 ease-in-out lg:flex",
          sidebarExpanded ? "w-72 px-5" : "w-[4.75rem] px-3",
        )}
      >
        <div
          className={cn(
            "flex items-start gap-2",
            sidebarExpanded ? "justify-between" : "flex-col items-center",
          )}
        >
          {sidebarExpanded ? (
            <Card className="min-w-0 flex-1 border-white/20 bg-white/10 text-white shadow-none">
              <CardHeader className="p-4">
                <CardDescription className="text-xs font-semibold tracking-wide text-ama-cyan uppercase">
                  Gestão interna
                </CardDescription>
                <CardTitle className="text-2xl tracking-tight">AMA Itajaí</CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <img
              src="/logo-amaitajai.png"
              alt="AMA Itajaí"
              className="size-10 rounded-md object-contain"
            />
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 text-white/80 hover:bg-white/10 hover:text-white",
              sidebarExpanded ? "size-9" : "size-10 w-full",
            )}
            onClick={() => setSidebarExpanded((current) => !current)}
            aria-label={sidebarExpanded ? "Recolher menu lateral" : "Expandir menu lateral"}
            title={sidebarExpanded ? "Recolher menu" : "Expandir menu"}
          >
            {sidebarExpanded ? (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        <nav className={cn("mt-8 flex-1 space-y-2", !sidebarExpanded && "mt-6")}>
          <AppSidebarNav
            sidebarItems={sidebarItems}
            sidebarGroups={sidebarGroups}
            sidebarExpanded={sidebarExpanded}
            onExpandSidebar={() => setSidebarExpanded(true)}
          />
        </nav>

        <Button
          onClick={logout}
          title="Sair do sistema"
          aria-label="Sair do sistema"
          className={cn(
            "mt-6 bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90",
            sidebarExpanded ? "w-full" : "size-10 w-full px-0",
          )}
          disabled={leaving}
        >
          {sidebarExpanded ? (
            leaving ? "Saindo..." : "Sair do sistema"
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
        </Button>
      </aside>

      <section
        className={cn(
          "flex min-h-screen min-w-0 flex-col overflow-x-hidden transition-[margin] duration-300 ease-in-out max-lg:pt-36",
          sidebarExpanded ? "lg:ml-72" : "lg:ml-[4.75rem]",
        )}
      >
        <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
          <header className="flex items-center justify-between gap-3 border-b border-ama-cyan/20 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
            <div>
              <Badge variant="secondary" className="bg-ama-light text-ama-blue-dark">
                Gestão interna
              </Badge>
              <p className="mt-2 text-sm font-medium text-ama-text">AMA Itajaí</p>
            </div>
            <Button
              onClick={logout}
              className="bg-ama-blue text-white hover:bg-ama-blue-dark"
              disabled={leaving}
            >
              {leaving ? "Saindo..." : "Sair"}
            </Button>
          </header>

          <nav className="border-b border-ama-cyan/20 bg-ama-blue-dark px-4 py-3">
            <AppMobileNav
              sidebarItems={sidebarItems}
              sidebarGroups={sidebarGroups}
              cadastroItemsExpanded={mobileCadastrosOpen}
              onCadastroItemsExpandedChange={setMobileCadastrosOpen}
            />
          </nav>
        </div>

        {error ? (
          <p className="mx-4 mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6 md:mx-8">
            {error}
          </p>
        ) : null}

        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 md:px-8">
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            <Outlet />
          </div>
        </div>
      </section>
    </main>
  );
}
