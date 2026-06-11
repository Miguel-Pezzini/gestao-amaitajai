import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/features/agenda/components/FieldError";
import { PatientSearchField } from "@/features/agenda/components/PatientSearchField";
import { ProfessionalAvailabilityList } from "@/features/agenda/components/ProfessionalAvailabilityList";
import {
  canAddSessionProfessional,
  getParticipantCountLabels,
  SESSION_FORMAT_LABELS,
} from "@/features/agenda/constants";
import { UPDATE_SCOPE_OPTIONS, WEEKDAY_OPTIONS } from "@/features/agenda/utils/recurrence";

export function CreateSessionDialog({
  open,
  setOpen,
  saving,
  loadingCatalogs = false,
  mode = "create",
  form,
  fieldErrors,
  sessionTypes,
  rooms,
  modalityOptions,
  sessionLimits,
  onFormChange,
  onSubmit,
  onClose,
  participantSlotReady,
  patientTerm,
  setPatientTerm,
  patientOptions,
  loadingPatients,
  onAddPatient,
  onRemovePatient,
  professionalRoster,
  professionalAvailabilityMeta,
  loadingProfessionals,
  onAddProfessional,
  onRemoveProfessional,
  onToggleApoio,
  onApoioTimeChange,
  onToggleRecurrence,
  onToggleRecurrenceWeekday,
  hasSeries = false,
  updateScope = "SINGLE",
  onUpdateScopeChange,
}) {
  const isEdit = mode === "edit";
  const participantCounts = getParticipantCountLabels(
    form.modality,
    form.selectedPatients.length,
    form.selectedProfessionals.length,
    sessionLimits,
  );

  const selectedPatientIds = new Set(form.selectedPatients.map((item) => item.id));
  const selectedProfessionalIds = new Set(form.selectedProfessionals.map((item) => item.id));

  const visiblePatientOptions = patientOptions.filter((item) => !selectedPatientIds.has(item._id));
  const showProfessionalRoster = canAddSessionProfessional(
    form.modality,
    form.selectedProfessionals.length,
    sessionLimits,
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
      title={isEdit ? "Editar sessão" : "Nova sessão"}
      description={
        isEdit
          ? "Altere os dados da sessão. Sessões recorrentes permitem escolher o escopo da edição."
          : undefined
      }
    >
      {loadingCatalogs ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="sessionTypeId">Modalidade</Label>
            <Select
              value={form.sessionTypeId || undefined}
              onValueChange={(value) => onFormChange("sessionTypeId", value)}
              disabled={saving}
            >
              <SelectTrigger
                id="sessionTypeId"
                className="w-full"
                aria-invalid={Boolean(fieldErrors.sessionTypeId)}
              >
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.sessionTypeId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modality">Tipo de sessão</Label>
            <Select
              value={form.modality}
              onValueChange={(value) => onFormChange("modality", value)}
              disabled={saving}
            >
              <SelectTrigger id="modality" className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {modalityOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {SESSION_FORMAT_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomId">Sala</Label>
            <Select
              value={form.roomId || undefined}
              onValueChange={(value) => onFormChange("roomId", value)}
              disabled={saving}
            >
              <SelectTrigger
                id="roomId"
                className="w-full"
                aria-invalid={Boolean(fieldErrors.roomId)}
              >
                <SelectValue placeholder="Selecione a sala" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room._id} value={room._id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.roomId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Início</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) => onFormChange("startDate", event.target.value)}
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.startAt)}
              />
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
            <FieldError message={fieldErrors.startAt} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duração (min)</Label>
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

          <PatientSearchField
            countLabel={participantCounts.patients}
            searchTerm={patientTerm}
            onSearchTermChange={setPatientTerm}
            options={visiblePatientOptions}
            loading={loadingPatients}
            selectedItems={form.selectedPatients}
            onAdd={onAddPatient}
            onRemove={onRemovePatient}
            fieldError={fieldErrors.patients}
            saving={saving}
          />

          <ProfessionalAvailabilityList
            countLabel={participantCounts.professionals}
            slotReady={participantSlotReady}
            showRoster={showProfessionalRoster}
            roster={professionalRoster}
            loading={loadingProfessionals}
            availabilityMeta={professionalAvailabilityMeta}
            selectedItems={form.selectedProfessionals}
            selectedIds={selectedProfessionalIds}
            onAdd={onAddProfessional}
            onRemove={onRemoveProfessional}
            onToggleApoio={onToggleApoio}
            onApoioTimeChange={onApoioTimeChange}
            modality={form.modality}
            fieldError={fieldErrors}
            saving={saving}
            getOptionLabel={(item) => item.name}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(event) => onFormChange("notes", event.target.value)}
              disabled={saving}
            />
          </div>

          {isEdit && hasSeries ? (
            <fieldset className="space-y-2 rounded-lg border border-ama-cyan/20 bg-ama-light/20 p-3">
              <legend className="px-1 text-sm font-medium">Escopo da edição</legend>
              <div className="space-y-2">
                {UPDATE_SCOPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-ama-cyan/20 px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="updateScope"
                      value={option.value}
                      checked={updateScope === option.value}
                      onChange={() => onUpdateScopeChange?.(option.value)}
                      disabled={saving}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {!isEdit ? (
          <div className="space-y-3 rounded-lg border border-ama-cyan/20 bg-ama-light/20 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(form.recurrenceEnabled)}
                onChange={(event) => onToggleRecurrence(event.target.checked)}
                disabled={saving}
              />
              Repetir semanalmente
            </label>

            {form.recurrenceEnabled ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map((option) => {
                      const selected = form.recurrenceWeekdays.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`rounded-md border px-3 py-1.5 text-sm ${
                            selected
                              ? "border-ama-blue bg-ama-blue text-white"
                              : "border-input bg-background text-foreground"
                          }`}
                          onClick={() => onToggleRecurrenceWeekday(option.value)}
                          disabled={saving}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <FieldError message={fieldErrors.recurrenceWeekdays} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndsAt">Repetir até</Label>
                  <Input
                    id="recurrenceEndsAt"
                    type="date"
                    value={form.recurrenceEndsAt}
                    onChange={(event) => onFormChange("recurrenceEndsAt", event.target.value)}
                    disabled={saving}
                    aria-invalid={Boolean(fieldErrors.recurrenceEndsAt)}
                  />
                  <FieldError message={fieldErrors.recurrenceEndsAt} />
                  <p className="text-xs text-muted-foreground">
                    Por padrão, até o final do ano dos atendimentos.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              type="submit"
              className="w-full bg-ama-blue text-white hover:bg-ama-blue-dark sm:flex-1"
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : form.recurrenceEnabled
                    ? "Criar série recorrente"
                    : "Criar sessão"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={saving}
            >
              Fechar
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
