import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ENTITY_LIST_ICON_ACTION_TONES = {
  default: "border-input/80 text-ama-blue-dark hover:bg-ama-light hover:text-ama-blue-dark",
  destructive: "border-input/80 text-destructive hover:bg-destructive/10 hover:text-destructive",
  success:
    "border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
};

export function EntityStatusBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
  pendingLabel = "Pendente",
  status,
}) {
  const resolvedStatus =
    status ?? (active === true ? "ATIVO" : active === false ? "INATIVO" : "ATIVO");

  if (resolvedStatus === "PENDENTE") {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-amber-500/40 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
      >
        {pendingLabel}
      </Badge>
    );
  }

  const isActive = resolvedStatus === "ATIVO";

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
        "overflow-visible rounded-xl border border-ama-cyan/20 bg-card shadow-sm transition-colors hover:border-ama-cyan/35",
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
        <div className="flex shrink-0 flex-row items-center gap-1 overflow-visible">
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

export function entityListIconActionClassName(extra = "") {
  return cn("shrink-0", extra);
}

export function EntityListIconAction({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  tone = "default",
  iconClassName,
}) {
  return (
    <Tooltip content={label}>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className={cn(
          entityListIconActionClassName(),
          ENTITY_LIST_ICON_ACTION_TONES[tone] ?? ENTITY_LIST_ICON_ACTION_TONES.default,
          disabled && "pointer-events-none",
        )}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
      >
        <Icon className={cn("size-4", iconClassName)} aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}

export function EntityNameForm({
  id,
  label,
  form,
  fieldErrors,
  saving,
  isEditing,
  onSubmit,
  onCancel,
  onFormChange,
  createLabel = "Cadastrar",
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={form.name}
          onChange={(event) => onFormChange("name", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.name ? (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
          disabled={saving}
        >
          {saving ? (
            <>
              <Spinner size="sm" />
              Salvando...
            </>
          ) : isEditing ? (
            "Salvar"
          ) : (
            createLabel
          )}
        </Button>
      </div>
    </form>
  );
}
