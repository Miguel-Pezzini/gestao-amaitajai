import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/features/agenda/components/FieldError";
import { SelectedItems } from "@/features/agenda/components/SelectedItems";
import { SelectedProfessionalsEditor } from "@/features/agenda/components/SelectedProfessionalsEditor";
import { formatAvailabilityBadge, formatConflictSessionLabel } from "@/features/agenda/utils";

function ProfessionalRow({ item, label, onAdd, allowPartialSelection = false }) {
  const busy = !item.isAvailable;
  const blocked = busy && !allowPartialSelection;

  return (
    <button
      type="button"
      disabled={blocked}
      onClick={() => onAdd(item)}
      className={`flex w-full items-start gap-2 rounded px-1.5 py-1 text-left text-sm ${
        blocked ? "cursor-not-allowed opacity-50" : busy ? "hover:bg-amber-50" : "hover:bg-ama-light"
      }`}
      title={
        busy
          ? allowPartialSelection
            ? "Ocupado parcialmente — selecione e use Apoio para ajustar o horário"
            : formatConflictSessionLabel(item.conflictSession)
          : undefined
      }
    >
      <span
        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${busy ? "bg-amber-400" : "bg-emerald-500"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ama-blue-dark">{label}</span>
        {busy && item.conflictSession ? (
          <span className="block truncate text-[11px] text-muted-foreground">
            {allowPartialSelection
              ? "Parcialmente ocupado · use Apoio após selecionar"
              : formatConflictSessionLabel(item.conflictSession)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function ProfessionalAvailabilityList({
  countLabel,
  slotReady,
  showRoster = true,
  roster,
  loading,
  availabilityMeta,
  selectedItems,
  selectedIds,
  onAdd,
  onRemove,
  onToggleApoio,
  onApoioTimeChange,
  modality,
  fieldError,
  saving,
  getOptionLabel,
}) {
  const [filter, setFilter] = useState("");
  const availabilityBadge = slotReady ? formatAvailabilityBadge(availabilityMeta) : "";
  const headerMeta = [countLabel, availabilityBadge].filter(Boolean).join(" · ");

  const filteredRoster = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const items = term
      ? roster.filter((item) => getOptionLabel(item).toLowerCase().includes(term))
      : roster;

    return [...items].sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return getOptionLabel(a).localeCompare(getOptionLabel(b), "pt-BR");
    });
  }, [filter, roster, getOptionLabel]);

  const visibleRoster = filteredRoster.filter((item) => !selectedIds.has(item._id));

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="professionalFilter">Profissionais</Label>
        {headerMeta ? <span className="text-xs text-muted-foreground">{headerMeta}</span> : null}
      </div>

      {!slotReady ? (
        <p className="text-xs text-muted-foreground">Defina o horário acima.</p>
      ) : showRoster ? (
        <>
          <Input
            id="professionalFilter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar lista"
            disabled={saving || loading}
            className="h-8 text-sm"
          />

          {loading ? (
            <p className="text-xs text-muted-foreground">…</p>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-md border border-ama-cyan/20 bg-ama-light/20 p-1">
              {visibleRoster.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground">Nenhum profissional.</p>
              ) : (
                visibleRoster.map((item) => (
                  <ProfessionalRow
                    key={item._id}
                    item={item}
                    label={getOptionLabel(item)}
                    onAdd={onAdd}
                    allowPartialSelection={modality === "GRUPO"}
                  />
                ))
              )}
            </div>
          )}
        </>
      ) : null}

      {modality === "GRUPO" ? (
        <SelectedProfessionalsEditor
          items={selectedItems.map((item) => ({
            ...item,
            apoioFieldError: fieldError?.[`apoio_${item.id}`] ?? item.apoioFieldError ?? "",
          }))}
          onRemove={onRemove}
          onToggleApoio={onToggleApoio}
          onApoioTimeChange={onApoioTimeChange}
          fieldError={typeof fieldError === "string" ? fieldError : fieldError?.professionals}
          saving={saving}
        />
      ) : (
        <>
          <SelectedItems items={selectedItems} onRemove={onRemove} />
          <FieldError message={typeof fieldError === "string" ? fieldError : fieldError?.professionals} />
        </>
      )}
    </div>
  );
}
