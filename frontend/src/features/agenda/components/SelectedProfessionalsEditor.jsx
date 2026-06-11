import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/features/agenda/components/FieldError";
import { formatConflictSessionLabel } from "@/features/agenda/utils";

export function SelectedProfessionalsEditor({
  items,
  onRemove,
  onToggleApoio,
  onApoioTimeChange,
  fieldError,
  saving,
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-md border border-ama-cyan/20 bg-ama-light/20 p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ama-blue-dark">{item.label}</p>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-ama-blue-dark">
                <input
                  type="checkbox"
                  checked={Boolean(item.isApoio)}
                  onChange={(event) => onToggleApoio(item.id, event.target.checked)}
                  disabled={saving}
                />
                Apoio
              </label>
              {item.rosterConflict && !item.isApoio ? (
                <p className="mt-1 text-[11px] text-amber-700">
                  Ocupado parcialmente neste horário. Marque Apoio e ajuste entrada/saída.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="shrink-0 rounded-md border border-ama-cyan/40 bg-ama-light px-2 py-1 text-xs text-ama-blue-dark hover:bg-ama-cyan/20"
              title="Remover"
              disabled={saving}
            >
              ×
            </button>
          </div>

          {item.isApoio ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`apoio-start-${item.id}`} className="text-xs">
                  Entrada
                </Label>
                <Input
                  id={`apoio-start-${item.id}`}
                  type="time"
                  value={item.participationStartTime ?? ""}
                  onChange={(event) =>
                    onApoioTimeChange(item.id, "participationStartTime", event.target.value)
                  }
                  disabled={saving}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`apoio-end-${item.id}`} className="text-xs">
                  Saída
                </Label>
                <Input
                  id={`apoio-end-${item.id}`}
                  type="time"
                  value={item.participationEndTime ?? ""}
                  onChange={(event) =>
                    onApoioTimeChange(item.id, "participationEndTime", event.target.value)
                  }
                  disabled={saving}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ) : null}

          {item.apoioFieldError ? <FieldError message={item.apoioFieldError} /> : null}
          {item.apoioConflict ? (
            <p className="mt-1 text-[11px] text-amber-700">
              {formatConflictSessionLabel(item.apoioConflict)}
            </p>
          ) : null}
        </div>
      ))}
      <FieldError message={fieldError} />
    </div>
  );
}
