import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/contexts/session-context";
import { AgendaCalendarView } from "@/features/agenda/components/AgendaCalendarView";
import { CancelSessionDialog } from "@/features/agenda/components/CancelSessionDialog";
import { CreateSessionDialog } from "@/features/agenda/components/CreateSessionDialog";
import { useAgendaPage } from "@/hooks/useAgendaPage";

export function AgendaPage() {
  const { userName, user } = useSession();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const agenda = useAgendaPage(user);

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

      {agenda.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {agenda.error}
        </p>
      ) : null}
      {agenda.success ? (
        <p className="rounded-md border border-ama-cyan/40 bg-ama-light px-3 py-2 text-sm text-ama-blue-dark">
          {agenda.success}
        </p>
      ) : null}

      <AgendaCalendarView
        sessions={agenda.sessions}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        onCompleteSession={agenda.handleCompleteSession}
        onCancelSession={agenda.openCancelDialog}
        onOpenCreate={agenda.openCreateDialog}
        isAdmin={agenda.isAdmin}
      />

      <CreateSessionDialog
        open={agenda.createDialogOpen}
        setOpen={agenda.setCreateDialogOpen}
        saving={agenda.saving}
        form={agenda.form}
        sessionTypes={agenda.sessionTypes}
        rooms={agenda.rooms}
        onFormChange={agenda.handleFormChange}
        onSubmit={agenda.handleCreateSession}
        onClose={agenda.closeCreateDialog}
        patientTerm={agenda.patientTerm}
        setPatientTerm={agenda.setPatientTerm}
        patientOptions={agenda.patientOptions}
        loadingPatients={agenda.loadingPatients}
        onAddPatient={agenda.addPatient}
        onRemovePatient={agenda.removePatient}
        professionalTerm={agenda.professionalTerm}
        setProfessionalTerm={agenda.setProfessionalTerm}
        professionalOptions={agenda.professionalOptions}
        loadingProfessionals={agenda.loadingProfessionals}
        onAddProfessional={agenda.addProfessional}
        onRemoveProfessional={agenda.removeProfessional}
        fieldError={agenda.fieldError}
      />

      <CancelSessionDialog
        open={agenda.cancelDialogOpen}
        setOpen={agenda.setCancelDialogOpen}
        saving={agenda.saving}
        cancelReason={agenda.cancelReason}
        setCancelReason={agenda.setCancelReason}
        onSubmit={agenda.handleCancelSession}
        onClose={agenda.closeCancelDialog}
      />
    </div>
  );
}
