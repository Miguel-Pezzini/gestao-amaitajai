import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { listPatients } from "@/services/patients";

export function PatientReplacementPicker({
  value,
  selectedLabel,
  excludePatientId,
  onChange,
  disabled,
  error,
  inputId,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 1) {
      setOptions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await listPatients({
          search: trimmed,
          status: "active",
          limit: 8,
        });
        setOptions(
          (response.items ?? []).filter((item) => item._id !== excludePatientId),
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [excludePatientId, searchTerm]);

  function handleSelect(patient) {
    onChange(patient);
    setSearchTerm("");
    setOptions([]);
  }

  function handleClear() {
    onChange(null);
    setSearchTerm("");
    setOptions([]);
  }

  if (value && selectedLabel) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{selectedLabel}</span>
          <button
            type="button"
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            disabled={disabled}
          >
            Trocar
          </button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Input
        id={inputId}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar paciente por nome"
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />

      {loading ? <p className="text-xs text-muted-foreground">Buscando…</p> : null}

      {!loading && searchTerm.trim() && options.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum paciente encontrado.</p>
      ) : null}

      {!loading && options.length > 0 ? (
        <div className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border border-input p-1">
          {options.map((item) => (
            <button
              key={item._id}
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-ama-light"
              onClick={() => handleSelect(item)}
              disabled={disabled}
            >
              {item.fullName}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
