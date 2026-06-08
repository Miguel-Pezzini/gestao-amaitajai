import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  PROTOCOL_REQUEST_TYPES,
  PROTOCOL_STATUSES,
} from "@/features/protocols/constants";
import {
  formatProtocolDate,
  formatProtocolNumber,
  getProtocolRequestTypeLabel,
  getProtocolStatusLabel,
} from "@/features/protocols/utils";
import {
  createProtocol,
  listPatientProtocols,
  updateProtocolStatus,
} from "@/services/protocols";

const EMPTY_FORM = {
  requestType: "DOCUMENTO",
  notes: "",
};

export function PatientProtocolsDialog({ patient, open, onOpenChange, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [protocols, setProtocols] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

    loadProtocols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient?._id]);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await createProtocol({
        patientId: patient._id,
        requestType: form.requestType,
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

  async function handleStatusChange(protocolId, status) {
    setError("");
    try {
      await updateProtocolStatus(protocolId, status);
      await loadProtocols();
      onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status do protocolo.",
      );
    }
  }

  return (
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
                value={form.requestType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, requestType: event.target.value }))
                }
                disabled={saving}
              >
                {PROTOCOL_REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getProtocolRequestTypeLabel(type)}
                  </option>
                ))}
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
                      {getProtocolRequestTypeLabel(protocol.requestType)}
                    </p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
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
                </div>

                {protocol.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{protocol.notes}</p>
                ) : null}

                <p className="mt-2 text-xs text-muted-foreground">
                  Aberto em {formatProtocolDate(protocol.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
