import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/agenda/components/FieldError";
import {
  getParticipantCountLabels,
  getSessionFormatHint,
  SESSION_FORMAT_LABELS,
  SESSION_FORMAT_OPTIONS,
} from "@/features/agenda/constants";
import { SelectedItems } from "./SelectedItems";

export function CreateSessionDialog({
  open,
  setOpen,
  saving,
  form,
  fieldErrors,
  sessionTypes,
  rooms,
  onFormChange,
  onSubmit,
  onClose,
  patientTerm,
  setPatientTerm,
  patientOptions,
  loadingPatients,
  onAddPatient,
  onRemovePatient,
  professionalTerm,
  setProfessionalTerm,
  professionalOptions,
  loadingProfessionals,
  onAddProfessional,
  onRemoveProfessional,
}) {
  const participantCounts = getParticipantCountLabels(
    form.modality,
    form.selectedPatients.length,
    form.selectedProfessionals.length,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
          return;
        }
        setOpen(true);
      }}
      title="Nova sessão"
      description="Autocomplete de pacientes e profissionais já busca ao digitar."
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="sessionTypeId">Modalidade</Label>
          <select
            id="sessionTypeId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.sessionTypeId}
            onChange={(event) => onFormChange("sessionTypeId", event.target.value)}
            disabled={saving}
            aria-invalid={Boolean(fieldErrors.sessionTypeId)}
          >
            {sessionTypes.map((type) => (
              <option key={type._id} value={type._id}>
                {type.name}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.sessionTypeId} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modality">Tipo de sessão</Label>
          <select
            id="modality"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.modality}
            onChange={(event) => onFormChange("modality", event.target.value)}
            disabled={saving}
          >
            {SESSION_FORMAT_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {SESSION_FORMAT_LABELS[item]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{getSessionFormatHint(form.modality)}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomId">Sala</Label>
          <select
            id="roomId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.roomId}
            onChange={(event) => onFormChange("roomId", event.target.value)}
            disabled={saving}
            aria-invalid={Boolean(fieldErrors.roomId)}
          >
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.roomId} />
        </div>

        <div className="space-y-2">
          <Label>Início</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="startDate" className="text-xs text-muted-foreground">
                Data
              </label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) => onFormChange("startDate", event.target.value)}
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.startAt)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="startTime" className="text-xs text-muted-foreground">
                Hora
              </label>
              <Input
                id="startTime"
                type="time"
                step="60"
                value={form.startTime}
                onChange={(event) => onFormChange("startTime", event.target.value)}
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.startAt)}
              />
            </div>
          </div>
          <FieldError message={fieldErrors.startAt} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duração (minutos)</Label>
          <Input
            id="durationMinutes"
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(event) => onFormChange("durationMinutes", event.target.value)}
            disabled={saving}
            aria-invalid={Boolean(fieldErrors.durationMinutes)}
          />
          <FieldError message={fieldErrors.durationMinutes} />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="patientSearch">Pacientes</Label>
            {participantCounts.patients ? (
              <span className="text-xs text-muted-foreground">{participantCounts.patients}</span>
            ) : null}
          </div>
          <Input
            id="patientSearch"
            value={patientTerm}
            onChange={(event) => setPatientTerm(event.target.value)}
            placeholder="Digite nome do paciente"
            disabled={saving}
            aria-invalid={Boolean(fieldErrors.patients)}
          />
          {loadingPatients ? <p className="text-xs text-muted-foreground">Buscando pacientes...</p> : null}
          {!loadingPatients && patientOptions.length > 0 ? (
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
              {patientOptions.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="w-full rounded px-2 py-1 text-left text-sm hover:bg-ama-light"
                  onClick={() => onAddPatient(item)}
                >
                  {item.fullName}
                </button>
              ))}
            </div>
          ) : null}
          <SelectedItems items={form.selectedPatients} onRemove={onRemovePatient} />
          <FieldError message={fieldErrors.patients} />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="professionalSearch">Profissionais</Label>
            {participantCounts.professionals ? (
              <span className="text-xs text-muted-foreground">{participantCounts.professionals}</span>
            ) : null}
          </div>
          <Input
            id="professionalSearch"
            value={professionalTerm}
            onChange={(event) => setProfessionalTerm(event.target.value)}
            placeholder="Digite nome ou e-mail"
            disabled={saving}
            aria-invalid={Boolean(fieldErrors.professionals)}
          />
          {loadingProfessionals ? (
            <p className="text-xs text-muted-foreground">Buscando profissionais...</p>
          ) : null}
          {!loadingProfessionals && professionalOptions.length > 0 ? (
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
              {professionalOptions.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="w-full rounded px-2 py-1 text-left text-sm hover:bg-ama-light"
                  onClick={() => onAddProfessional(item)}
                >
                  {item.name} ({item.email})
                </button>
              ))}
            </div>
          ) : null}
          <SelectedItems items={form.selectedProfessionals} onRemove={onRemoveProfessional} />
          <FieldError message={fieldErrors.professionals} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Input
            id="notes"
            value={form.notes}
            onChange={(event) => onFormChange("notes", event.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            type="submit"
            className="w-full bg-ama-blue text-white hover:bg-ama-blue-dark sm:flex-1"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Criar sessão"}
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
