import { useEffect, useState } from "react";
import { searchAgendaPatients } from "@/services/agenda";
import { useToast } from "@/contexts/toast-context";
import {
  createProtocol,
  listProtocolTypes,
  listProtocols,
  updateProtocolStatus,
} from "@/services/protocols";

const EMPTY_FORM = {
  patientId: "",
  protocolTypeId: "",
  notes: "",
};

export function useProtocolsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDENTE");
  const [protocols, setProtocols] = useState([]);
  const [protocolTypes, setProtocolTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [patientTerm, setPatientTerm] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
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

  function clearFilters() {
    setSearch("");
    setStatusFilter("PENDENTE");
    loadProtocolsWithParams({ search: "", status: "PENDENTE" });
  }

  async function loadProtocolsWithParams(overrides = {}) {
    setLoading(true);
    setError("");
    const nextSearch = overrides.search !== undefined ? overrides.search : search;
    const nextStatus = overrides.status !== undefined ? overrides.status : statusFilter;

    try {
      const response = await listProtocols({
        search: nextSearch || undefined,
        status: nextStatus || undefined,
        limit: 50,
      });
      setProtocols(response.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar os protocolos. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProtocols() {
    return loadProtocolsWithParams();
  }

  useEffect(() => {
    loadProtocolTypes();
    loadProtocols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!formDialogOpen) {
      return;
    }

    const trimmed = patientTerm.trim();
    if (trimmed.length < 1) {
      setPatientOptions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoadingPatients(true);
      try {
        const response = await searchAgendaPatients({ q: trimmed, limit: 8 });
        setPatientOptions(response.items ?? []);
      } catch {
        setPatientOptions([]);
      } finally {
        setLoadingPatients(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [patientTerm, formDialogOpen]);

  function resetForm() {
    const defaultTypeId = activeProtocolTypes[0]?._id ?? "";
    setForm({ ...EMPTY_FORM, protocolTypeId: defaultTypeId });
    setFieldErrors({});
    setPatientTerm("");
    setPatientOptions([]);
    setSelectedPatient(null);
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    resetForm();
  }

  function openCreateDialog() {
    resetForm();
    setFormDialogOpen(true);
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    handleFormChange("patientId", patient._id);
    setPatientTerm("");
    setPatientOptions([]);
  }

  function handleClearPatient() {
    setSelectedPatient(null);
    handleFormChange("patientId", "");
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);

    const errors = {};
    if (!form.patientId) {
      errors.patientId = "Selecione o paciente.";
    }
    if (!form.protocolTypeId) {
      errors.protocolTypeId = "Selecione o tipo de solicitação.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    setFieldErrors({});

    try {
      await createProtocol({
        patientId: form.patientId,
        protocolTypeId: form.protocolTypeId,
        notes: form.notes.trim(),
      });
      toast.success("Protocolo criado com sucesso.");
      closeFormDialog();
      await loadProtocols();
    } catch (err) {
      toast.error(
        err.response?.data?.message ??
          "Não foi possível criar o protocolo. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteProtocol(protocolId) {
    setCompletingProtocolId(protocolId);
    try {
      await updateProtocolStatus(protocolId, "CONCLUIDO");
      toast.success("Protocolo concluído com sucesso.");
      await loadProtocols();
    } catch (err) {
      toast.error(
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

    setCancellingProtocolId(cancelProtocolId);
    try {
      await updateProtocolStatus(cancelProtocolId, "CANCELADO", {
        cancelReason: trimmedReason,
      });
      toast.success("Protocolo cancelado com sucesso.");
      closeCancelDialog();
      await loadProtocols();
    } catch (err) {
      toast.error(
        err.response?.data?.message ??
          "Não foi possível cancelar o protocolo.",
      );
    } finally {
      setCancellingProtocolId(null);
    }
  }

  return {
    loading,
    saving,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    protocols,
    protocolTypes: activeProtocolTypes,
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
  };
}
