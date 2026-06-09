import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PatientReplacementPicker } from "@/features/patients/components/PatientReplacementPicker";
import {
  formatCancellationSummary,
  formatReplacementLabel,
  formatReplacementMeta,
} from "@/features/patients/utils/deactivation";

export function DeactivatePatientDialog({
  open,
  patient,
  impact,
  selections,
  selectionLabels,
  selectionErrors,
  saving,
  error,
  onSelectionChange,
  onClose,
  onConfirm,
}) {
  const cancellations = impact?.cancellations ?? [];
  const replacements = impact?.replacements ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
      title="Inativar paciente"
      description={
        replacements.length > 0
          ? `Escolha quem assume as sessões de ${patient?.fullName ?? "o paciente"}.`
          : `Confirme a inativação de ${patient?.fullName ?? "o paciente"}.`
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
        className="space-y-4"
      >
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {cancellations.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {formatCancellationSummary(cancellations.length)}
          </p>
        ) : null}

        {replacements.length > 0 ? (
          <ul className="divide-y divide-ama-cyan/15 overflow-hidden rounded-lg border border-ama-cyan/20">
            {replacements.map((item, index) => (
              <li key={item.key} className="flex gap-3 bg-background px-3 py-3">
                <span className="w-5 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{formatReplacementLabel(item)}</p>
                    <p className="text-xs text-muted-foreground">{formatReplacementMeta(item)}</p>
                  </div>
                  <PatientReplacementPicker
                    inputId={`replacement-${item.key}`}
                    value={selections[item.key] ?? ""}
                    selectedLabel={selectionLabels[item.key] ?? ""}
                    excludePatientId={patient?._id}
                    onChange={(selectedPatient) => onSelectionChange(item.key, selectedPatient)}
                    disabled={saving}
                    error={selectionErrors[item.key]}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {cancellations.length === 0 && replacements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão agendada será alterada.</p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={saving}
          >
            Confirmar inativação
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
