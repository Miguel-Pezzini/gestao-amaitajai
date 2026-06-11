import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/contexts/session-context";
import { buildSessionLimitsMap } from "@/features/agenda/constants";
import { AgendaCalendarView } from "@/features/agenda/components/AgendaCalendarView";
import { CancelSessionDialog } from "@/features/agenda/components/CancelSessionDialog";
import { CreateSessionDialog } from "@/features/agenda/components/CreateSessionDialog";
import { useAgendaPage } from "@/hooks/useAgendaPage";

export function AgendaPage() {
  const { userName, user } = useSession();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const agenda = useAgendaPage(user);
  const selectedSessionType = agenda.sessionTypes.find((item) => item._id === agenda.form.sessionTypeId);
  const modalityOptions =
    selectedSessionType?.allowedModalities?.length ? selectedSessionType.allowedModalities : ["INDIVIDUAL"];
  const sessionLimits = buildSessionLimitsMap(agenda.sessionModalitySettings);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-3">
          <CardTitle className="text-xl text-ama-text">Agenda</CardTitle>
          <CardDescription>
            Olá, {userName}. Consulte sessões e acompanhe execução conforme seu perfil.
          </CardDescription>
        </CardHeader>
      </Card>

      <AgendaCalendarView
        sessions={agenda.sessions}
        referenceDate={referenceDate}
        setReferenceDate={setReferenceDate}
        onCompleteSession={agenda.handleCompleteSession}
        onCancelSession={agenda.openCancelDialog}
        onEditSession={agenda.openEditDialog}
        onOpenCreate={agenda.openCreateDialog}
        isAdmin={agenda.isAdmin}
      />

      <CreateSessionDialog
        open={agenda.createDialogOpen}
        setOpen={agenda.setCreateDialogOpen}
        saving={agenda.saving}
        loadingCatalogs={agenda.loadingCatalogs}
        form={agenda.form}
        fieldErrors={agenda.fieldErrors}
        sessionTypes={agenda.sessionTypes}
        rooms={agenda.rooms}
        modalityOptions={modalityOptions}
        sessionLimits={sessionLimits}
        onFormChange={agenda.handleFormChange}
        onSubmit={agenda.handleCreateSession}
        onClose={agenda.closeCreateDialog}
        participantSlotReady={agenda.participantSlotReady}
        patientTerm={agenda.patientTerm}
        setPatientTerm={agenda.setPatientTerm}
        patientOptions={agenda.patientOptions}
        loadingPatients={agenda.loadingPatients}
        onAddPatient={agenda.addPatient}
        onRemovePatient={agenda.removePatient}
        professionalRoster={agenda.professionalRoster}
        professionalAvailabilityMeta={agenda.professionalAvailabilityMeta}
        loadingProfessionals={agenda.loadingProfessionals}
        onAddProfessional={agenda.addProfessional}
        onRemoveProfessional={agenda.removeProfessional}
        onToggleRecurrence={agenda.handleToggleRecurrence}
        onToggleRecurrenceWeekday={agenda.handleToggleRecurrenceWeekday}
      />

      <CreateSessionDialog
        open={agenda.editDialogOpen}
        setOpen={agenda.setEditDialogOpen}
        mode="edit"
        saving={agenda.saving}
        loadingCatalogs={agenda.loadingCatalogs}
        form={agenda.form}
        fieldErrors={agenda.fieldErrors}
        sessionTypes={agenda.sessionTypes}
        rooms={agenda.rooms}
        modalityOptions={modalityOptions}
        sessionLimits={sessionLimits}
        onFormChange={agenda.handleFormChange}
        onSubmit={agenda.handleUpdateSession}
        onClose={agenda.closeEditDialog}
        participantSlotReady={agenda.participantSlotReady}
        patientTerm={agenda.patientTerm}
        setPatientTerm={agenda.setPatientTerm}
        patientOptions={agenda.patientOptions}
        loadingPatients={agenda.loadingPatients}
        onAddPatient={agenda.addPatient}
        onRemovePatient={agenda.removePatient}
        professionalRoster={agenda.professionalRoster}
        professionalAvailabilityMeta={agenda.professionalAvailabilityMeta}
        loadingProfessionals={agenda.loadingProfessionals}
        onAddProfessional={agenda.addProfessional}
        onRemoveProfessional={agenda.removeProfessional}
        hasSeries={agenda.editSessionHasSeries}
        updateScope={agenda.updateScope}
        onUpdateScopeChange={agenda.handleUpdateScopeChange}
      />

      <CancelSessionDialog
        open={agenda.cancelDialogOpen}
        setOpen={agenda.setCancelDialogOpen}
        saving={agenda.saving}
        cancelReason={agenda.cancelReason}
        cancelReasonError={agenda.cancelReasonError}
        cancelScope={agenda.cancelScope}
        cancelScopeError={agenda.cancelScopeError}
        hasSeries={agenda.cancelSessionHasSeries}
        onCancelReasonChange={agenda.handleCancelReasonChange}
        onCancelScopeChange={agenda.handleCancelScopeChange}
        onSubmit={agenda.handleCancelSession}
        onClose={agenda.closeCancelDialog}
      />
    </div>
  );
}
