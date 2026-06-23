import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ProtocolPatientSearchField({
  searchTerm,
  onSearchTermChange,
  options,
  loading,
  selectedPatient,
  onSelect,
  onClear,
  fieldError,
  saving,
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="protocol-patient-search">Usuário</Label>

      {selectedPatient ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-ama-cyan/30 bg-ama-light/40 px-3 py-2">
          <span className="text-sm font-medium text-ama-blue-dark">{selectedPatient.fullName}</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onClear}
            disabled={saving}
          >
            Remover
          </button>
        </div>
      ) : (
        <>
          <Input
            id="protocol-patient-search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Buscar usuário"
            disabled={saving}
            aria-invalid={Boolean(fieldError)}
          />

          {loading ? <p className="text-xs text-muted-foreground">Buscando...</p> : null}

          {!loading && options.length > 0 ? (
            <div className="max-h-32 space-y-0.5 overflow-y-auto rounded-md border p-1.5">
              {options.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="w-full rounded px-2 py-1 text-left text-sm hover:bg-ama-light"
                  onClick={() => onSelect(item)}
                >
                  {item.fullName}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
    </div>
  );
}
