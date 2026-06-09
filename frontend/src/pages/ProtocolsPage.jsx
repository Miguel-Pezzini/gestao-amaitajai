import {
  EntityList,
  EntityListItem,
  EntityListItemFooterRow,
  entityListActionButtonClassName,
} from "@/components/cadastros/EntityListItem";
import { CreateFab } from "@/components/cadastros/CreateFab";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingProtocolBadge } from "@/features/protocols/components/PendingProtocolBadge";
import { ProtocolPatientSearchField } from "@/features/protocols/components/ProtocolPatientSearchField";
import { PROTOCOL_STATUSES } from "@/features/protocols/constants";
import {
  formatProtocolDate,
  formatProtocolNumber,
  getProtocolTypeLabel,
  getProtocolStatusLabel,
} from "@/features/protocols/utils";
import { useProtocolsPage } from "@/hooks/useProtocolsPage";
import { useSession } from "@/contexts/session-context";

function ProtocolForm({
  form,
  fieldErrors,
  protocolTypes,
  patientTerm,
  onPatientTermChange,
  patientOptions,
  loadingPatients,
  selectedPatient,
  onSelectPatient,
  onClearPatient,
  saving,
  onSubmit,
  onCancel,
  onFormChange,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <ProtocolPatientSearchField
        searchTerm={patientTerm}
        onSearchTermChange={onPatientTermChange}
        options={patientOptions}
        loading={loadingPatients}
        selectedPatient={selectedPatient}
        onSelect={onSelectPatient}
        onClear={onClearPatient}
        fieldError={fieldErrors.patientId}
        saving={saving}
      />

      <div className="space-y-2">
        <Label htmlFor="protocol-type">Tipo de solicitação</Label>
        <select
          id="protocol-type"
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.protocolTypeId}
          onChange={(event) => onFormChange("protocolTypeId", event.target.value)}
          disabled={saving || protocolTypes.length === 0}
        >
          {protocolTypes.length === 0 ? (
            <option value="">Cadastre tipos em Cadastros Gerais</option>
          ) : (
            protocolTypes.map((type) => (
              <option key={type._id} value={type._id}>
                {type.name}
              </option>
            ))
          )}
        </select>
        {fieldErrors.protocolTypeId ? (
          <p className="text-sm text-destructive">{fieldErrors.protocolTypeId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="protocol-notes">Observações</Label>
        <textarea
          id="protocol-notes"
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.notes}
          onChange={(event) => onFormChange("notes", event.target.value)}
          disabled={saving}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Abrir protocolo"}
        </Button>
      </div>
    </form>
  );
}

export function ProtocolsPage() {
  const { userName } = useSession();
  const {
    loading,
    saving,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    protocols,
    protocolTypes,
    form,
    fieldErrors,
    formDialogOpen,
    setFormDialogOpen,
    patientTerm,
    setPatientTerm,
    patientOptions,
    loadingPatients,
    selectedPatient,
    loadProtocols,
    closeFormDialog,
    openCreateDialog,
    handleFormChange,
    handleSelectPatient,
    handleClearPatient,
    handleCreate,
    handleStatusChange,
  } = useProtocolsPage();

  const pendingCount = protocols.filter((protocol) => protocol.status === "PENDENTE").length;

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Protocolos
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Registre solicitações administrativas dos responsáveis e
            acompanhe pendências por atendido.
          </CardDescription>
        </CardHeader>
      </Card>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm break-words text-destructive">
          {error}
        </p>
      ) : null}

      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
        title="Novo protocolo"
        description="Abra um pedido vinculado ao atendido. O número será gerado automaticamente."
      >
        <ProtocolForm
          form={form}
          fieldErrors={fieldErrors}
          protocolTypes={protocolTypes}
          patientTerm={patientTerm}
          onPatientTermChange={setPatientTerm}
          patientOptions={patientOptions}
          loadingPatients={loadingPatients}
          selectedPatient={selectedPatient}
          onSelectPatient={handleSelectPatient}
          onClearPatient={handleClearPatient}
          saving={saving}
          onSubmit={handleCreate}
          onCancel={closeFormDialog}
          onFormChange={handleFormChange}
        />
      </Dialog>

      {!formDialogOpen ? (
        <CreateFab onClick={openCreateDialog} label="Novo protocolo" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">
              Protocolos registrados
            </CardTitle>
            <CardDescription className="break-words">
              {pendingCount} pendente(s) em {protocols.length} carregado(s).
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 space-y-2 sm:max-w-xs sm:flex-1">
              <Label htmlFor="protocol-search">Paciente, responsável ou número</Label>
              <Input
                id="protocol-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </div>
            <div className="space-y-2 sm:w-40">
              <Label htmlFor="protocol-status-filter">Status</Label>
              <select
                id="protocol-status-filter"
                className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Todos</option>
                {PROTOCOL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getProtocolStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="shrink-0 bg-ama-cyan px-6 text-ama-blue-dark shadow-sm hover:bg-ama-cyan/90"
              onClick={loadProtocols}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando protocolos...</p>
          ) : protocols.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum protocolo encontrado para os filtros informados.
            </p>
          ) : (
            <EntityList>
              {protocols.map((protocol) => (
                <EntityListItem
                  key={protocol._id}
                  title={
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>{protocol.patient?.fullName ?? "Paciente"}</span>
                      {protocol.status === "PENDENTE" ? <PendingProtocolBadge /> : null}
                    </span>
                  }
                  badges={
                    <span className="rounded-full border border-ama-cyan/60 px-2.5 py-0.5 text-xs font-medium text-ama-blue">
                      {formatProtocolNumber(protocol.protocolNumber)}
                    </span>
                  }
                >
                  <p className="break-words">
                    <span className="text-foreground/80">Solicitação:</span>{" "}
                    {getProtocolTypeLabel(protocol)}
                  </p>
                  {protocol.notes ? (
                    <p className="break-words">
                      <span className="text-foreground/80">Observações:</span> {protocol.notes}
                    </p>
                  ) : null}
                  <EntityListItemFooterRow
                    actions={
                      <select
                        className={`${entityListActionButtonClassName()} h-9 rounded-md border border-input bg-background px-3 py-1 text-sm`}
                        value={protocol.status}
                        onChange={(event) =>
                          handleStatusChange(protocol._id, event.target.value)
                        }
                      >
                        {PROTOCOL_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {getProtocolStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    }
                  >
                    <p>
                      <span className="text-foreground/80">Aberto em:</span>{" "}
                      {formatProtocolDate(protocol.createdAt)}
                    </p>
                  </EntityListItemFooterRow>
                </EntityListItem>
              ))}
            </EntityList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
