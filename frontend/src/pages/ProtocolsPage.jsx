import { Check, ClipboardList, Loader2, Search, X } from "lucide-react";
import {
  EntityList,
  EntityListItem,
  EntityListIconAction,
  EntityListItemFooterRow,
  EntityTagBadge,
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
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PendingProtocolBadge } from "@/features/protocols/components/PendingProtocolBadge";
import { CancelProtocolDialog } from "@/features/protocols/components/CancelProtocolDialog";
import { ProtocolStatusDates } from "@/features/protocols/components/ProtocolStatusDates";
import { ProtocolPatientSearchField } from "@/features/protocols/components/ProtocolPatientSearchField";
import { PROTOCOL_STATUSES } from "@/features/protocols/constants";
import {
  formatProtocolNumber,
  getProtocolTypeLabel,
  getProtocolStatusLabel,
} from "@/features/protocols/utils";
import { SELECT_ALL_VALUE } from "@/constants/select";
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
        <Select
          value={form.protocolTypeId || undefined}
          onValueChange={(value) => onFormChange("protocolTypeId", value)}
          disabled={saving || protocolTypes.length === 0}
        >
          <SelectTrigger id="protocol-type" className="w-full">
            <SelectValue
              placeholder={
                protocolTypes.length === 0
                  ? "Cadastre tipos em Cadastros Gerais"
                  : "Selecione o tipo"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {protocolTypes.map((type) => (
              <SelectItem key={type._id} value={type._id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {saving ? (
            <>
              <Spinner size="sm" />
              Salvando...
            </>
          ) : (
            "Abrir protocolo"
          )}
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
    clearFilters,
    closeFormDialog,
    openCreateDialog,
    handleFormChange,
    handleSelectPatient,
    handleClearPatient,
    handleCreate,
    completingProtocolId,
    handleCompleteProtocol,
    cancelDialogOpen,
    cancelReason,
    cancelReasonError,
    cancellingProtocolId,
    openCancelDialog,
    closeCancelDialog,
    handleCancelReasonChange,
    handleCancelProtocol,
  } = useProtocolsPage();

  const pendingCount = protocols.filter((protocol) => protocol.status === "PENDENTE").length;
  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "PENDENTE");

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

      {error ? <InlineAlert>{error}</InlineAlert> : null}

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

      <CancelProtocolDialog
        open={cancelDialogOpen}
        saving={Boolean(cancellingProtocolId)}
        cancelReason={cancelReason}
        cancelReasonError={cancelReasonError}
        onCancelReasonChange={handleCancelReasonChange}
        onSubmit={handleCancelProtocol}
        onClose={closeCancelDialog}
      />

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

          <form
            className="grid min-w-0 gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              loadProtocols();
            }}
            noValidate
          >
            <div className="min-w-0 space-y-2">
              <Label htmlFor="protocol-search">Paciente, responsável ou número</Label>
              <Input
                id="protocol-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="protocol-status-filter">Status</Label>
              <Select
                value={statusFilter || SELECT_ALL_VALUE}
                onValueChange={(value) =>
                  setStatusFilter(value === SELECT_ALL_VALUE ? "" : value)
                }
              >
                <SelectTrigger id="protocol-status-filter" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL_VALUE}>Todos</SelectItem>
                  {PROTOCOL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getProtocolStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="justify-self-end bg-ama-cyan px-6 text-ama-blue-dark shadow-sm hover:bg-ama-cyan/90 sm:col-span-2"
              disabled={loading}
            >
              Buscar
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <ListSkeleton />
          ) : protocols.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={Search}
                title="Nenhum resultado"
                description="Nenhum protocolo encontrado para os filtros informados."
                actionLabel="Limpar filtros"
                onAction={clearFilters}
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum protocolo pendente"
                description="Não há solicitações aguardando conclusão no momento."
                actionLabel="Novo protocolo"
                onAction={openCreateDialog}
              />
            )
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
                      protocol.status === "PENDENTE" ? (
                        <>
                          <EntityListIconAction
                            icon={
                              completingProtocolId === protocol._id ? Loader2 : Check
                            }
                            label={
                              completingProtocolId === protocol._id
                                ? "Concluindo..."
                                : "Concluir protocolo"
                            }
                            tone="success"
                            iconClassName={
                              completingProtocolId === protocol._id ? "animate-spin" : undefined
                            }
                            onClick={() => handleCompleteProtocol(protocol._id)}
                            disabled={
                              completingProtocolId === protocol._id ||
                              cancellingProtocolId === protocol._id
                            }
                          />
                          <EntityListIconAction
                            icon={X}
                            label="Cancelar protocolo"
                            tone="destructive"
                            onClick={() => openCancelDialog(protocol._id)}
                            disabled={
                              completingProtocolId === protocol._id ||
                              cancellingProtocolId === protocol._id
                            }
                          />
                        </>
                      ) : (
                        <EntityTagBadge>
                          {getProtocolStatusLabel(protocol.status)}
                        </EntityTagBadge>
                      )
                    }
                  >
                    <ProtocolStatusDates protocol={protocol} />
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
