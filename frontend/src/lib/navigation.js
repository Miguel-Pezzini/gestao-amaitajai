import { APP_MODULES } from "@/config/modules";

function getUserRole(user) {
  const normalizedRole = String(user?.role ?? "").trim().toLowerCase();

  if (normalizedRole === "admin") {
    return "administrador";
  }
  if (normalizedRole === "therapist") {
    return "tecnico";
  }

  return normalizedRole || "tecnico";
}

function hasRoleAccess(moduleConfig, userRole) {
  return moduleConfig.requiredRoles.includes(userRole);
}

export function getNavigationBySession(user) {
  const userRole = getUserRole(user);

  const visibleModules = APP_MODULES.filter((moduleConfig) =>
    hasRoleAccess(moduleConfig, userRole),
  ).sort((a, b) => a.order - b.order);

  return {
    sidebarItems: visibleModules.filter((item) => item.showInSidebar),
    quickAccessItems: visibleModules.filter((item) => item.showInQuickAccess),
  };
}
