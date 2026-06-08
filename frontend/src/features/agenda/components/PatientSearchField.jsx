import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/features/agenda/components/FieldError";
import { SelectedItems } from "@/features/agenda/components/SelectedItems";

export function PatientSearchField({
  countLabel,
  searchTerm,
  onSearchTermChange,
  options,
  loading,
  selectedItems,
  onAdd,
  onRemove,
  fieldError,
  saving,
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="patientSearch">Pacientes</Label>
        {countLabel ? <span className="text-xs text-muted-foreground">{countLabel}</span> : null}
      </div>

      <Input
        id="patientSearch"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Buscar paciente"
        disabled={saving}
        aria-invalid={Boolean(fieldError)}
      />

      {loading ? <p className="text-xs text-muted-foreground">…</p> : null}

      {!loading && options.length > 0 ? (
        <div className="max-h-32 space-y-0.5 overflow-y-auto rounded-md border p-1.5">
          {options.map((item) => (
            <button
              key={item._id}
              type="button"
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-ama-light"
              onClick={() => onAdd(item)}
            >
              {item.fullName}
            </button>
          ))}
        </div>
      ) : null}

      <SelectedItems items={selectedItems} onRemove={onRemove} />
      <FieldError message={fieldError} />
    </div>
  );
}
