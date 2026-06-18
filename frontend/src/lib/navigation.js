import { CADASTRO_ITEMS, CADASTROS_GROUP } from "@/config/cadastros";
import { APP_MODULES } from "@/config/modules";

function getUserRole(user) {
  const normalizedRole = String(user?.role ?? "").trim().toUpperCase();

  if (normalizedRole === "ADMIN") {
    return "ADMINISTRADOR";
  }
  if (normalizedRole === "THERAPIST") {
    return "TECNICO";
  }

  return normalizedRole || "TECNICO";
}

function hasRoleAccess(moduleConfig, userRole) {
  return moduleConfig.requiredRoles.includes(userRole);
}

export function getNavigationBySession(user) {
  const userRole = getUserRole(user);

  if (userRole === "OPERADOR") {
    return {
      sidebarItems: [],
      sidebarGroups: [],
      quickAccessItems: [],
    };
  }

  const visibleModules = APP_MODULES.filter(
    (moduleConfig) => moduleConfig.enabled && hasRoleAccess(moduleConfig, userRole),
  ).sort((a, b) => a.order - b.order);

  const sidebarItems = visibleModules.filter((item) => item.showInSidebar);
  const quickAccessItems = visibleModules.filter((item) => item.showInQuickAccess);

  const showCadastros = hasRoleAccess(CADASTROS_GROUP, userRole);
  const sidebarGroups = showCadastros
    ? [
        {
          ...CADASTROS_GROUP,
          items: [...CADASTRO_ITEMS].sort((a, b) => a.order - b.order),
        },
      ]
    : [];

  return {
    sidebarItems,
    sidebarGroups,
    quickAccessItems,
  };
}
