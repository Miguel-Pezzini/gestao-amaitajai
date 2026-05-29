import { useEffect } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AppMobileHeader({ menuOpen, onMenuOpenChange }) {
  return (
    <header className="relative flex min-h-16 items-center justify-center border-b border-ama-cyan/30 bg-ama-blue-dark px-4 py-3 text-white sm:px-6">
      <button
        type="button"
        className={cn(
          "absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-white transition-colors",
          "hover:bg-white/10 active:bg-white/15",
          menuOpen && "bg-white/15",
        )}
        onClick={() => onMenuOpenChange(!menuOpen)}
        aria-expanded={menuOpen}
        aria-controls="app-mobile-menu"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
      >
        {menuOpen ? (
          <X className="size-7" strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <Menu className="size-7" strokeWidth={2.25} aria-hidden="true" />
        )}
      </button>

      <div className="flex min-w-0 max-w-[calc(100%-6rem)] flex-col items-center gap-0.5 px-12 text-center">
        <p className="text-[0.6875rem] font-semibold tracking-wide text-ama-cyan uppercase">
          Gestão interna
        </p>
        <p className="truncate text-base font-medium text-white">AMA Itajaí</p>
      </div>
    </header>
  );
}

export function AppMobileMenuDrawer({
  open,
  onOpenChange,
  sidebarItems,
  sidebarGroups,
  logout,
  leaving,
}) {
  const location = useLocation();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    onOpenChange(false);
  }, [location.pathname, onOpenChange]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-label="Fechar menu"
        tabIndex={open ? 0 : -1}
        onClick={() => onOpenChange(false)}
      />

      <aside
        id="app-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-ama-cyan/30 bg-ama-blue-dark px-5 py-6 text-white shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Card className="border-white/20 bg-white/10 text-white shadow-none">
          <CardHeader className="p-4">
            <CardDescription className="text-xs font-semibold tracking-wide text-ama-cyan uppercase">
              Gestão interna
            </CardDescription>
            <CardTitle className="text-xl tracking-tight">AMA Itajaí</CardTitle>
          </CardHeader>
        </Card>

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
          <AppSidebarNav
            sidebarItems={sidebarItems}
            sidebarGroups={sidebarGroups}
            sidebarExpanded
            onExpandSidebar={() => {}}
          />
        </nav>

        <Button
          onClick={logout}
          className="mt-6 w-full bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
          disabled={leaving}
        >
          {leaving ? "Saindo..." : "Sair do sistema"}
        </Button>
      </aside>
    </div>
  );
}
