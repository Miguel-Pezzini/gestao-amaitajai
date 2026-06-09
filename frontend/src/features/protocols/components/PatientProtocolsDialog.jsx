import { useEffect, useState } from "react";
import { EntityTagBadge } from "@/components/cadastros/EntityListItem";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CancelProtocolDialog } from "@/features/protocols/components/CancelProtocolDialog";
import { ProtocolStatusDates } from "@/features/protocols/components/ProtocolStatusDates";
import {
  formatProtocolNumber,
  getProtocolTypeLabel,
  getProtocolStatusLabel,
} from "@/features/protocols/utils";
import {
  createProtocol,
  listPatientProtocols,
  listProtocolTypes,
  updateProtocolStatus,
} from "@/services/protocols";

const EMPTY_FORM = {
  protocolTypeId: "",
  notes: "",
};

export function PatientProtocolsDialog({ patient, open, onOpenChange, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [protocols, setProtocols] = useState([]);
  const [protocolTypes, setProtocolTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [completingProtocolId, setCompletingProtocolId] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelProtocolId, setCancelProtocolId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [cancellingProtocolId, setCancellingProtocolId] = useState(null);

  const activeProtocolTypes = protocolTypes.filter((item) => item.isActive);

  async function loadProtocolTypes() {
    try {
      const response = await listProtocolTypes();
      setProtocolTypes(response.items ?? []);
    } catch {
      setProtocolTypes([]);
    }
  }

  async function loadProtocols() {
    if (!patient?._id) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await listPatientProtocols(patient._id);
      setProtocols(response.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar os protocolos deste paciente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setShowCreateForm(false);
      setForm(EMPTY_FORM);
      setError("");
      return;
    }

    loadProtocolTypes();
    loadProtocols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient?._id]);

  useEffect(() => {
    if (!showCreateForm || form.protocolTypeId || activeProtocolTypes.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      protocolTypeId: activeProtocolTypes[0]._id,
    }));
  }, [showCreateForm, activeProtocolTypes, form.protocolTypeId]);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!form.protocolTypeId) {
      setError("Selecione um tipo de solicitação.");
      setSaving(false);
      return;
    }

    try {
      await createProtocol({
        patientId: patient._id,
        protocolTypeId: form.protocolTypeId,
        notes: form.notes.trim(),
      });
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      await loadProtocols();
      onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível criar o protocolo. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteProtocol(protocolId) {
    setError("");
    setCompletingProtocolId(protocolId);
    try {
      await updateProtocolStatus(protocolId, "CONCLUIDO");
      await loadProtocols();
      onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível concluir o protocolo.",
      );
    } finally {
      setCompletingProtocolId(null);
    }
  }

  function openCancelDialog(protocolId) {
    setCancelProtocolId(protocolId);
    setCancelReason("");
    setCancelReasonError("");
    setCancelDialogOpen(true);
  }

  function closeCancelDialog() {
    setCancelDialogOpen(false);
    setCancelProtocolId("");
    setCancelReason("");
    setCancelReasonError("");
  }

  function handleCancelReasonChange(value) {
    setCancelReason(value);
    if (value.trim()) {
      setCancelReasonError("");
    }
  }

  async function handleCancelProtocol(event) {
    event.preventDefault();
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setCancelReasonError("Informe a justificativa do cancelamento.");
      return;
    }

    setError("");
    setCancellingProtocolId(cancelProtocolId);
    try {
      await updateProtocolStatus(cancelProtocolId, "CANCELADO", {
        cancelReason: trimmedReason,
      });
      closeCancelDialog();
      await loadProtocols();
      onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível cancelar o protocolo.",
      );
    } finally {
      setCancellingProtocolId(null);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Protocolos — ${patient?.fullName ?? ""}`}
        description="Solicitações administrativas em aberto ou concluídas deste atendido."
      >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!showCreateForm ? (
          <Button
            type="button"
            className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
            onClick={() => setShowCreateForm(true)}
            disabled={activeProtocolTypes.length === 0}
          >
            Novo protocolo
          </Button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-ama-cyan/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="patient-protocol-type">Tipo de solicitação</Label>
              <select
                id="patient-protocol-type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.protocolTypeId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, protocolTypeId: event.target.value }))
                }
                disabled={saving || activeProtocolTypes.length === 0}
              >
                {activeProtocolTypes.length === 0 ? (
                  <option value="">Cadastre tipos em Cadastros Gerais</option>
                ) : (
                  activeProtocolTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-protocol-notes">Observações</Label>
              <textarea
                id="patient-protocol-notes"
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={saving}
              >
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
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando protocolos...</p>
        ) : protocols.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum protocolo registrado para este paciente.
          </p>
        ) : (
          <div className="space-y-2.5">
            {protocols.map((protocol) => (
              <article
                key={protocol._id}
                className="rounded-xl border border-ama-cyan/20 bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-ama-blue-dark">
                      {formatProtocolNumber(protocol.protocolNumber)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getProtocolTypeLabel(protocol)}
                    </p>
                  </div>
                  {protocol.status === "PENDENTE" ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 border-input/80 text-ama-blue-dark hover:bg-ama-light hover:text-ama-blue-dark"
                        onClick={() => handleCompleteProtocol(protocol._id)}
                        disabled={
                          completingProtocolId === protocol._id ||
                          cancellingProtocolId === protocol._id
                        }
                      >
                        {completingProtocolId === protocol._id
                          ? "Concluindo..."
                          : "Concluir protocolo"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 border-input/80 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openCancelDialog(protocol._id)}
                        disabled={
                          completingProtocolId === protocol._id ||
                          cancellingProtocolId === protocol._id
                        }
                      >
                        Cancelar protocolo
                      </Button>
                    </div>
                  ) : (
                    <EntityTagBadge>
                      {getProtocolStatusLabel(protocol.status)}
                    </EntityTagBadge>
                  )}
                </div>

                {protocol.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{protocol.notes}</p>
                ) : null}

                <div className="mt-2 text-xs text-muted-foreground">
                  <ProtocolStatusDates protocol={protocol} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
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
    </>
  );
}
