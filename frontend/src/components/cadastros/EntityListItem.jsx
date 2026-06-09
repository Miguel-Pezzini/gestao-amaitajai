import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EntityStatusBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
  pendingLabel = "Pendente",
  status,
}) {
  const resolvedStatus =
    status ?? (active === true ? "ativo" : active === false ? "inativo" : "ativo");

  if (resolvedStatus === "pendente") {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-amber-500/40 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
      >
        {pendingLabel}
      </Badge>
    );
  }

  const isActive = resolvedStatus === "ativo";

  return (
    <Badge
      variant={isActive ? "secondary" : "outline"}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive
          ? "border-transparent bg-ama-light text-ama-blue-dark"
          : "border-muted-foreground/30 text-muted-foreground",
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  );
}

export function EntityTagBadge({ children, className }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-ama-cyan/60 px-2.5 py-0.5 text-xs font-medium text-ama-blue",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function EntityList({ children, className }) {
  return <div className={cn("space-y-2.5", className)}>{children}</div>;
}

export function EntityListItem({ title, children, badges, className }) {
  return (
    <article
      className={cn(
        "rounded-xl border border-ama-cyan/20 bg-card shadow-sm transition-colors hover:border-ama-cyan/35",
        className,
      )}
    >
      <div className="space-y-2 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h3 className="min-w-0 flex-1 text-base leading-snug font-semibold tracking-tight break-words text-ama-blue-dark">
            {title}
          </h3>
          {badges ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              {badges}
            </div>
          ) : null}
        </div>

        {children ? (
          <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function EntityListItemFooterRow({ children, actions }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:items-center sm:gap-4",
        children ? "sm:justify-between" : "sm:justify-end",
      )}
    >
      {children ? <div className="min-w-0 flex-1">{children}</div> : null}
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function entityListActionButtonClassName(extra = "") {
  return cn(
    "h-8 w-full border-input/80 text-ama-blue-dark hover:bg-ama-light hover:text-ama-blue-dark sm:w-auto",
    extra,
  );
}
