import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAdminRoute } from "@/components/auth/RequireAdminRoute";
import { RequireRolesRoute } from "@/components/auth/RequireRolesRoute";
import { RequireSalesRoute } from "@/components/auth/RequireSalesRoute";
import { SessionProvider } from "@/contexts/session-context";
import { AppLayout } from "@/layouts/AppLayout";
import { VendasLayout, VendasSection } from "@/layouts/VendasLayout";
import { AgendaPage } from "@/pages/AgendaPage";
import { ModalidadesPage } from "@/pages/cadastros/ModalidadesPage";
import { SalasPage } from "@/pages/cadastros/SalasPage";
import { TiposCusteioPage } from "@/pages/cadastros/TiposCusteioPage";
import { TiposProtocoloPage } from "@/pages/cadastros/TiposProtocoloPage";
import { TiposSessaoPage } from "@/pages/cadastros/TiposSessaoPage";
import { UsuariosPage } from "@/pages/cadastros/UsuariosPage";
import { HomePage } from "@/pages/HomePage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { LoginPage } from "@/pages/LoginPage";
import { ModuleComingSoonPage } from "@/pages/ModuleComingSoonPage";
import { RoomOccupancyPage } from "@/pages/RoomOccupancyPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { AgendaPatientLocatorPage } from "@/pages/AgendaPatientLocatorPage";
import { ProtocolsPage } from "@/pages/ProtocolsPage";
import { FiadosPage } from "@/pages/vendas/FiadosPage";
import { ProductsPage } from "@/pages/vendas/ProductsPage";
import { SalesListPage } from "@/pages/vendas/SalesListPage";
import { useSession } from "@/contexts/session-context";
import { LoadingState } from "@/components/ui/loading-state";
import { normalizeRole } from "@/features/agenda/utils";

function AuthenticatedLayout() {
  const { hydrating, user } = useSession();
  const userRole = normalizeRole(user?.role);

  if (hydrating) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ama-light px-6">
        <LoadingState message="Carregando painel..." />
      </main>
    );
  }

  if (userRole === "OPERADOR") {
    return <VendasLayout />;
  }

  return <AppLayout />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/patients"
              element={
                <RequireAdminRoute>
                  <PatientsPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/protocols"
              element={
                <RequireRolesRoute roles={["ADMINISTRADOR", "RECEPCAO"]}>
                  <ProtocolsPage />
                </RequireRolesRoute>
              }
            />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route
              path="/agenda/localizar-atendido"
              element={
                <RequireRolesRoute roles={["ADMINISTRADOR", "RECEPCAO"]}>
                  <AgendaPatientLocatorPage />
                </RequireRolesRoute>
              }
            />
            <Route
              path="/salas/ocupacao"
              element={
                <RequireAdminRoute>
                  <RoomOccupancyPage />
                </RequireAdminRoute>
              }
            />
            <Route path="/attendance" element={<ModuleComingSoonPage />} />
            <Route path="/check-in" element={<ModuleComingSoonPage />} />
            <Route path="/waitlist" element={<ModuleComingSoonPage />} />
            <Route
              path="/cadastros/modalidades"
              element={
                <RequireAdminRoute>
                  <ModalidadesPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/cadastros/salas"
              element={
                <RequireAdminRoute>
                  <SalasPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/cadastros/tipos-protocolo"
              element={
                <RequireAdminRoute>
                  <TiposProtocoloPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/cadastros/tipos-custeio"
              element={
                <RequireAdminRoute>
                  <TiposCusteioPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/cadastros/funcionarios"
              element={
                <RequireAdminRoute>
                  <UsuariosPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/cadastros/tipos-sessao"
              element={
                <RequireAdminRoute>
                  <TiposSessaoPage />
                </RequireAdminRoute>
              }
            />
            <Route
              path="/cadastros/usuarios"
              element={<Navigate to="/cadastros/funcionarios" replace />}
            />
            <Route
              path="/vendas"
              element={
                <RequireSalesRoute>
                  <VendasSection />
                </RequireSalesRoute>
              }
            >
              <Route index element={<SalesListPage />} />
              <Route path="lista" element={<Navigate to="/vendas" replace />} />
              <Route path="nova" element={<Navigate to="/vendas" replace />} />
              <Route
                path="produtos"
                element={
                  <RequireAdminRoute>
                    <ProductsPage />
                  </RequireAdminRoute>
                }
              />
              <Route path="fiados" element={<FiadosPage />} />
              <Route path="dashboard" element={<ModuleComingSoonPage />} />
              <Route path="estoque" element={<ModuleComingSoonPage />} />
              <Route path="relatorios" element={<ModuleComingSoonPage />} />
            </Route>
            <Route path="/module/:moduleId" element={<ModuleComingSoonPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
