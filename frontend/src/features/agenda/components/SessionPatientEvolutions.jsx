import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSessionEvolutions } from "@/features/agenda/hooks/useSessionEvolutions";
import { EvolutionHistorySection } from "@/features/patients/components/EvolutionHistorySection";

const SESSION_HISTORY_PAGE_SIZE = 5;

function PatientEvolutionCard({
  item,
  sessionId,
  historyEnabled,
  draft,
  readOnly,
  saving,
  onDraftChange,
  onDiscard,
  onSave,
}) {
  const patientName = item.patient?.fullName ?? "Usuário";
  const savedContent = item.current?.content ?? "";
  const hasUnsavedChanges = draft !== savedContent;

  return (
    <article className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-ama-cyan/20 bg-ama-light/20 p-4">
      <h4 className="text-sm font-semibold text-ama-blue-dark">{patientName}</h4>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Evoluções anteriores
        </Label>
        <EvolutionHistorySection
          patientId={item.patient._id}
          excludeSessionId={sessionId}
          enabled={historyEnabled}
          pageSize={SESSION_HISTORY_PAGE_SIZE}
          emptyMessage="Nenhuma evolução anterior registrada para este usuário."
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor={`session-evolution-${item.patient._id}`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Evolução desta sessão
        </Label>
        <textarea
          id={`session-evolution-${item.patient._id}`}
          className="min-h-28 w-full max-w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm break-words"
          value={draft}
          onChange={(event) => onDraftChange(item.patient._id, event.target.value)}
          disabled={readOnly || saving}
          placeholder="Descreva a evolução do usuário nesta sessão..."
        />
      </div>

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
            {saving ? "Salvando..." : "Salvar evolução"}
          </Button>
        </div>
      )}
    </article>
  );
}

export function SessionPatientEvolutions({
  sessionId,
  sessionStatus,
  open,
  attendanceByPatientId = {},
}) {
  const {
    items,
    drafts,
    loading,
    savingPatientId,
    setDraftContent,
    discardEvolutionChanges,
    saveEvolution,
  } = useSessionEvolutions(sessionId, open);
  const readOnly = sessionStatus === "CANCELADA";
  const presentItems = items.filter(
    (item) => (attendanceByPatientId[item.patient._id]?.status ?? "PRESENTE") === "PRESENTE",
  );

  if (!open) {
    return null;
  }

  return (
    <section className="min-w-0 space-y-3 overflow-hidden border-t border-ama-cyan/15 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Evolução dos usuários
      </h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando evoluções...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum usuário vinculado a esta sessão.</p>
      ) : presentItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum usuário presente nesta sessão para registrar evolução.
        </p>
      ) : (
        <div className="space-y-4">
          {presentItems.map((item) => (
            <PatientEvolutionCard
              key={item.patient._id}
              item={item}
              sessionId={sessionId}
              historyEnabled={open}
              draft={drafts[item.patient._id] ?? ""}
              readOnly={readOnly}
              saving={savingPatientId === item.patient._id}
              onDraftChange={setDraftContent}
              onDiscard={discardEvolutionChanges}
              onSave={saveEvolution}
            />
          ))}
        </div>
      )}
    </section>
  );
}
