import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAdminRoute } from "@/components/auth/RequireAdminRoute";
import { SessionProvider } from "@/contexts/session-context";
import { AppLayout } from "@/layouts/AppLayout";
import { AgendaPage } from "@/pages/AgendaPage";
import { ModalidadesPage } from "@/pages/cadastros/ModalidadesPage";
import { SalasPage } from "@/pages/cadastros/SalasPage";
import { TiposProtocoloPage } from "@/pages/cadastros/TiposProtocoloPage";
import { TiposSessaoPage } from "@/pages/cadastros/TiposSessaoPage";
import { UsuariosPage } from "@/pages/cadastros/UsuariosPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { ModuleComingSoonPage } from "@/pages/ModuleComingSoonPage";
import { RoomOccupancyPage } from "@/pages/RoomOccupancyPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { ProtocolsPage } from "@/pages/ProtocolsPage";

function AuthenticatedLayout() {
  return <AppLayout />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
              <RequireAdminRoute>
                <ProtocolsPage />
              </RequireAdminRoute>
            }
          />
          <Route path="/agenda" element={<AgendaPage />} />
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
          <Route path="/module/:moduleId" element={<ModuleComingSoonPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
