import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider } from "@/contexts/session-context";
import { AppLayout } from "@/layouts/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { ModuleComingSoonPage } from "@/pages/ModuleComingSoonPage";
import { PatientsPage } from "@/pages/PatientsPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <SessionProvider>
              <AppLayout />
            </SessionProvider>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/agenda" element={<ModuleComingSoonPage />} />
          <Route path="/attendance" element={<ModuleComingSoonPage />} />
          <Route path="/check-in" element={<ModuleComingSoonPage />} />
          <Route path="/waitlist" element={<ModuleComingSoonPage />} />
          <Route path="/module/:moduleId" element={<ModuleComingSoonPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
