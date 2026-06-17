import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/session-context";
import { buildSessionLimitsMap } from "@/features/agenda/constants";
import { AgendaCalendarView } from "@/features/agenda/components/AgendaCalendarView";
import { CancelSessionDialog } from "@/features/agenda/components/CancelSessionDialog";
import { CreateSessionDialog } from "@/features/agenda/components/CreateSessionDialog";
import { FieldError } from "@/features/agenda/components/FieldError";
import { SessionChangeRequestDiff } from "@/features/agenda/components/SessionChangeRequestDiff";
import { formatSessionDateTime, sessionSummary } from "@/features/agenda/utils";
import { useAgendaPage } from "@/hooks/useAgendaPage";

export function AgendaPage() {
  const { userName, user } = useSession();
  const agenda = useAgendaPage(user);
  const selectedSessionType = agenda.sessionTypes.find((item) => item._id === agenda.form.sessionTypeId);
  const modalityOptions =
    selectedSessionType?.allowedModalities?.length ? selectedSessionType.allowedModalities : ["INDIVIDUAL"];
  const sessionLimits = buildSessionLimitsMap(agenda.sessionModalitySettings);
  const isRequestEdit = agenda.editIntent === "request";
  const isRequestCancel = agenda.cancelIntent === "request";

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-xl text-ama-text">Agenda</CardTitle>
            <CardDescription>
              Olá, {userName}. Consulte sessões e acompanhe execução conforme seu perfil.
            </CardDescription>
          </div>
          {agenda.isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="border-ama-cyan/40 shrink-0"
              onClick={() => agenda.setPendingRequestsOpen(true)}
            >
              Pedidos pendentes ({agenda.pendingRequests.length})
            </Button>
          ) : null}
        </CardHeader>
      </Card>

      <AgendaCalendarView
        sessions={agenda.sessions}
        referenceDate={agenda.referenceDate}
        setReferenceDate={agenda.setReferenceDate}
        viewMode={agenda.viewMode}
        setViewMode={agenda.setViewMode}
        loadingSessions={agenda.loadingSessions}
        onCompleteSession={agenda.handleCompleteSession}
        onCancelSession={agenda.openCancelDialog}
        onEditSession={agenda.openEditDialog}
        onRequestEditSession={agenda.openRequestEditDialog}
        onRequestCancelSession={agenda.openRequestCancelDialog}
        onOpenCreate={agenda.openCreateDialog}
        isAdmin={agenda.canManageAgenda}
        canOperateSession={agenda.canOperateSession}
        canViewClinicalData={agenda.canViewClinicalData}
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
        onToggleApoio={agenda.toggleProfessionalApoio}
        onApoioTimeChange={agenda.updateProfessionalApoioTime}
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
        onToggleApoio={agenda.toggleProfessionalApoio}
        onApoioTimeChange={agenda.updateProfessionalApoioTime}
        hasSeries={agenda.editSessionHasSeries}
        updateScope={agenda.updateScope}
        onUpdateScopeChange={agenda.handleUpdateScopeChange}
        dialogTitle={isRequestEdit ? "Solicitar edição" : undefined}
        submitLabel={isRequestEdit ? "Enviar pedido" : undefined}
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
        title={isRequestCancel ? "Solicitar cancelamento" : undefined}
        description={
          isRequestCancel
            ? "Informe o motivo. Um administrador precisará aprovar o pedido."
            : undefined
        }
        submitLabel={isRequestCancel ? "Enviar pedido" : undefined}
      />

      <Dialog
        open={agenda.pendingRequestsOpen}
        onOpenChange={agenda.setPendingRequestsOpen}
        title="Pedidos pendentes"
        description="Aprove ou rejeite alterações solicitadas por técnicos."
        className="sm:max-w-2xl"
      >
        {agenda.loadingPendingRequests ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : agenda.pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido pendente.</p>
        ) : (
          <ul className="space-y-3">
            {agenda.pendingRequests.map((request) => (
              <li
                key={request._id}
                className="rounded-lg border border-ama-cyan/20 bg-white p-4 space-y-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ama-blue-dark">
                    {request.type === "EDIT" ? "Edição" : "Cancelamento"} —{" "}
                    {request.session ? sessionSummary(request.session) : "Sessão"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado por {request.requestedBy?.name ?? "técnico"} em{" "}
                    {formatSessionDateTime(request.createdAt)}
                  </p>
                  <SessionChangeRequestDiff
                    request={request}
                    rooms={agenda.rooms}
                    sessionTypes={agenda.sessionTypes}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-ama-blue text-white hover:bg-ama-blue-dark"
                    disabled={agenda.saving}
                    onClick={() => agenda.handleApproveChangeRequest(request._id)}
                  >
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive"
                    disabled={agenda.saving}
                    onClick={() => agenda.openRejectDialog(request._id)}
                  >
                    Rejeitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Dialog>

      <Dialog
        open={Boolean(agenda.rejectRequestId)}
        onOpenChange={(open) => {
          if (!open) {
            agenda.closeRejectDialog();
          }
        }}
        title="Rejeitar pedido"
        description="Informe o motivo da rejeição para o técnico."
      >
        <form onSubmit={agenda.handleRejectChangeRequest} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Motivo</Label>
            <Input
              id="rejectReason"
              value={agenda.rejectReason}
              onChange={(event) => agenda.setRejectReason(event.target.value)}
              placeholder="Ex.: horário indisponível"
              disabled={agenda.saving}
              aria-invalid={Boolean(agenda.rejectReasonError)}
            />
            <FieldError message={agenda.rejectReasonError} />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={agenda.saving}
            >
              Confirmar rejeição
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={agenda.closeRejectDialog}
              disabled={agenda.saving}
            >
              Voltar
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
