import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getSessionAttendanceLabel,
  SESSION_ATTENDANCE_STATUSES,
} from "@/features/agenda/utils";

const ATTENDANCE_STYLES = {
  PRESENTE: {
    base: "border-emerald-200 bg-white text-emerald-900",
    selected: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30",
    accent: "accent-emerald-600",
  },
  FALTA: {
    base: "border-red-200 bg-white text-red-900",
    selected: "border-red-500 bg-red-50 ring-1 ring-red-500/30",
    accent: "accent-red-600",
  },
  FALTA_JUSTIFICADA: {
    base: "border-amber-200 bg-white text-amber-950",
    selected: "border-amber-500 bg-amber-50 ring-1 ring-amber-500/30",
    accent: "accent-amber-600",
  },
};

function PatientAttendanceCard({
  item,
  draft,
  readOnly,
  saving,
  onStatusChange,
  onJustificationChange,
  onDiscard,
  onSave,
}) {
  const patientName = item.patient?.fullName ?? "Paciente";
  const saved = item.current;
  const savedStatus = saved?.status ?? "PRESENTE";
  const savedJustification = saved?.justification ?? "";
  const hasUnsavedChanges =
    draft.status !== savedStatus || draft.justification !== savedJustification;
  const showJustification = draft.status === "FALTA_JUSTIFICADA";

  return (
    <article className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-ama-cyan/20 bg-ama-light/20 p-4">
      <h4 className="text-sm font-semibold text-ama-blue-dark">{patientName}</h4>

      <fieldset className="space-y-2" disabled={readOnly || saving}>
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Presença
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {SESSION_ATTENDANCE_STATUSES.map((status) => {
            const inputId = `session-attendance-${item.patient._id}-${status}`;
            const isSelected = draft.status === status;
            const styles = ATTENDANCE_STYLES[status] ?? ATTENDANCE_STYLES.PRESENTE;
            return (
              <label
                key={status}
                htmlFor={inputId}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  styles.base,
                  isSelected && styles.selected,
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={`session-attendance-${item.patient._id}`}
                  value={status}
                  checked={isSelected}
                  onChange={() => onStatusChange(item.patient._id, status)}
                  className={cn("size-4", styles.accent)}
                />
                {getSessionAttendanceLabel(status)}
              </label>
            );
          })}
        </div>
      </fieldset>

      {showJustification ? (
        <div className="space-y-2">
          <Label
            htmlFor={`session-attendance-justification-${item.patient._id}`}
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Justificativa
          </Label>
          <textarea
            id={`session-attendance-justification-${item.patient._id}`}
            className="min-h-20 w-full max-w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm break-words"
            value={draft.justification}
            onChange={(event) => onJustificationChange(item.patient._id, event.target.value)}
            disabled={readOnly || saving}
            placeholder="Descreva o motivo da falta justificada..."
          />
        </div>
      ) : null}

      {readOnly ? null : (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {hasUnsavedChanges ? (
            <Button
              type="button"
              variant="outline"
              className="border-ama-cyan/40"
              onClick={() => onDiscard(item.patient._id)}
              disabled={saving}
            >
              Descartar alterações
            </Button>
          ) : null}
          <Button
            type="button"
            className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
            onClick={() => onSave(item.patient._id)}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? "Salvando..." : "Salvar presença"}
          </Button>
        </div>
      )}
    </article>
  );
}

export function SessionPatientAttendance({ attendance, readOnly }) {
  const {
    items,
    drafts,
    loading,
    savingPatientId,
    setDraftStatus,
    setDraftJustification,
    discardAttendanceChanges,
    saveAttendance,
  } = attendance;

  return (
    <section className="min-w-0 space-y-3 overflow-hidden border-t border-ama-cyan/15 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Presença dos pacientes
      </h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando presença...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum paciente vinculado a esta sessão.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <PatientAttendanceCard
              key={item.patient._id}
              item={item}
              draft={
                drafts[item.patient._id] ?? {
                  status: item.current?.status ?? "PRESENTE",
                  justification: item.current?.justification ?? "",
                }
              }
              readOnly={readOnly}
              saving={savingPatientId === item.patient._id}
              onStatusChange={setDraftStatus}
              onJustificationChange={setDraftJustification}
              onDiscard={discardAttendanceChanges}
              onSave={saveAttendance}
            />
          ))}
        </div>
      )}
    </section>
  );
}
