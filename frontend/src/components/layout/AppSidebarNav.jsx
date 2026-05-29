import { useEffect, useState } from "react";
import { ChevronDown, FolderCog } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isActiveRoute(currentPath, itemRoute) {
  if (itemRoute === "/") {
    return currentPath === "/";
  }
  return currentPath === itemRoute || currentPath.startsWith(`${itemRoute}/`);
}

function isGroupActive(currentPath, routePrefix) {
  return currentPath === routePrefix || currentPath.startsWith(`${routePrefix}/`);
}

function SidebarNavItem({ item, active, sidebarExpanded, onNavigate }) {
  const Icon = item.icon;

  return (
    <Button
      variant="ghost"
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-10 w-full text-sm transition-colors",
        sidebarExpanded ? "justify-start gap-3 text-left" : "justify-center px-0",
        active
          ? "bg-white/15 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
      onClick={() => onNavigate(item.route)}
    >
      {Icon ? (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            active ? "bg-ama-cyan/25 text-ama-cyan" : "bg-white/10 text-white/90",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      ) : null}
      {sidebarExpanded ? <span className="truncate">{item.label}</span> : null}
    </Button>
  );
}

function SidebarNavGroup({
  group,
  currentPath,
  sidebarExpanded,
  isOpen,
  onToggle,
  onNavigate,
  onExpandSidebar,
}) {
  const groupActive = isGroupActive(currentPath, group.routePrefix);

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        title={group.label}
        aria-label={group.label}
        aria-expanded={isOpen}
        className={cn(
          "h-10 w-full text-sm transition-colors",
          sidebarExpanded ? "justify-start gap-3 text-left" : "justify-center px-0",
          groupActive
            ? "bg-white/15 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
        onClick={() => {
          if (!sidebarExpanded) {
            onExpandSidebar();
            onToggle(true);
            return;
          }
          onToggle(!isOpen);
        }}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            groupActive ? "bg-ama-cyan/25 text-ama-cyan" : "bg-white/10 text-white/90",
          )}
        >
          <FolderCog className="size-4" aria-hidden="true" />
        </span>
        {sidebarExpanded ? (
          <>
            <span className="min-w-0 flex-1 truncate">{group.label}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-white/70 transition-transform",
                isOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </>
        ) : null}
      </Button>

      {sidebarExpanded && isOpen ? (
        <div className="space-y-1 border-l border-white/15 pl-3">
          {group.items.map((item) => {
            const active = isActiveRoute(currentPath, item.route);
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "h-9 w-full justify-start gap-2.5 pl-2 text-left text-sm",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
                onClick={() => onNavigate(item.route)}
              >
                {Icon ? (
                  <Icon className="size-4 shrink-0 text-ama-cyan/90" aria-hidden="true" />
                ) : null}
                <span className="truncate">{item.label}</span>
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebarNav({
  sidebarItems,
  sidebarGroups,
  sidebarExpanded,
  onExpandSidebar,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [openGroups, setOpenGroups] = useState(() =>
    sidebarGroups
      .filter((group) => isGroupActive(currentPath, group.routePrefix))
      .map((group) => group.id),
  );

  useEffect(() => {
    const activeGroupIds = sidebarGroups
      .filter((group) => isGroupActive(currentPath, group.routePrefix))
      .map((group) => group.id);

    if (activeGroupIds.length === 0) {
      return;
    }

    setOpenGroups((current) => {
      const merged = new Set([...current, ...activeGroupIds]);
      return [...merged];
    });
  }, [currentPath, sidebarGroups]);

  function handleNavigate(route) {
    navigate(route);
  }

  function handleToggleGroup(groupId, open) {
    setOpenGroups((current) => {
      if (open) {
        return current.includes(groupId) ? current : [...current, groupId];
      }
      return current.filter((id) => id !== groupId);
    });
  }

  const sortedItems = [...sidebarItems].sort((a, b) => a.order - b.order);
  const sortedGroups = [...sidebarGroups].sort((a, b) => a.order - b.order);

  const navEntries = [
    ...sortedItems.map((item) => ({ type: "item", order: item.order, data: item })),
    ...sortedGroups.map((group) => ({ type: "group", order: group.order, data: group })),
  ].sort((a, b) => a.order - b.order);

  return (
    <>
      {navEntries.map((entry) => {
        if (entry.type === "item") {
          const item = entry.data;
          return (
            <SidebarNavItem
              key={item.id}
              item={item}
              active={isActiveRoute(currentPath, item.route)}
              sidebarExpanded={sidebarExpanded}
              onNavigate={handleNavigate}
            />
          );
        }

        const group = entry.data;
        return (
          <SidebarNavGroup
            key={group.id}
            group={group}
            currentPath={currentPath}
            sidebarExpanded={sidebarExpanded}
            isOpen={openGroups.includes(group.id)}
            onToggle={(open) => handleToggleGroup(group.id, open)}
            onNavigate={handleNavigate}
            onExpandSidebar={onExpandSidebar}
          />
        );
      })}
    </>
  );
}

