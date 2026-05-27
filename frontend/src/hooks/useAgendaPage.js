import { useEffect, useState } from "react";
import {
  cancelSession,
  completeSession,
  createSession,
  listRooms,
  listSessions,
  listSessionTypes,
  searchAgendaPatients,
  searchAgendaProfessionals,
} from "@/services/agenda";
import { EMPTY_FORM } from "@/features/agenda/constants";
import { normalizeRole } from "@/features/agenda/utils";

export function useAgendaPage(user) {
  const role = normalizeRole(user?.role);
  const isAdmin = role === "administrador";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldError, setFieldError] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [patientTerm, setPatientTerm] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [professionalTerm, setProfessionalTerm] = useState("");
  const [professionalOptions, setProfessionalOptions] = useState([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);

  async function loadDependencies() {
    const [roomsResponse, typesResponse] = await Promise.all([
      listRooms(),
      listSessionTypes(),
    ]);
    setRooms(roomsResponse.items ?? []);
    setSessionTypes(typesResponse.items ?? []);
  }

  async function loadSessions() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await listSessions();
      setSessions(response.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar a agenda. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        await loadDependencies();
        const response = await listSessions();
        if (!mounted) {
          return;
        }
        setSessions(response.items ?? []);
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ??
              "Não foi possível carregar os dados da agenda no momento.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!createDialogOpen) {
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
  }, [patientTerm, createDialogOpen]);

  useEffect(() => {
    if (!createDialogOpen) {
      return;
    }
    const trimmed = professionalTerm.trim();
    if (trimmed.length < 1) {
      setProfessionalOptions([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setLoadingProfessionals(true);
      try {
        const response = await searchAgendaProfessionals({ q: trimmed, limit: 8 });
        setProfessionalOptions(response.items ?? []);
      } catch {
        setProfessionalOptions([]);
      } finally {
        setLoadingProfessionals(false);
      }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [professionalTerm, createDialogOpen]);

  function handleFormChange(field, value) {
    setFieldError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetCreateForm() {
    setForm(EMPTY_FORM);
    setPatientTerm("");
    setProfessionalTerm("");
    setPatientOptions([]);
    setProfessionalOptions([]);
    setFieldError("");
  }

  function closeCreateDialog() {
    setCreateDialogOpen(false);
    resetCreateForm();
  }

  function toDatetimeLocalValue(date) {
    const local = new Date(date);
    local.setHours(9, 0, 0, 0);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().slice(0, 16);
  }

  function openCreateDialog(day) {
    if (day) {
      setForm({ ...EMPTY_FORM, startAt: toDatetimeLocalValue(day) });
      setPatientTerm("");
      setProfessionalTerm("");
      setPatientOptions([]);
      setProfessionalOptions([]);
      setFieldError("");
    } else {
      resetCreateForm();
    }
    setCreateDialogOpen(true);
  }

  function openCancelDialog(sessionId) {
    setCancelSessionId(sessionId);
    setCancelReason("");
    setCancelDialogOpen(true);
  }

  function closeCancelDialog() {
    setCancelDialogOpen(false);
    setCancelSessionId("");
    setCancelReason("");
  }

  function addPatient(option) {
    setForm((current) => {
      if (current.selectedPatients.some((item) => item.id === option._id)) {
        return current;
      }
      return {
        ...current,
        selectedPatients: [...current.selectedPatients, { id: option._id, label: option.fullName }],
      };
    });
    setPatientTerm("");
    setPatientOptions([]);
  }

  function removePatient(patientId) {
    setForm((current) => ({
      ...current,
      selectedPatients: current.selectedPatients.filter((item) => item.id !== patientId),
    }));
  }

  function addProfessional(option) {
    setForm((current) => {
      if (current.selectedProfessionals.some((item) => item.id === option._id)) {
        return current;
      }
      return {
        ...current,
        selectedProfessionals: [
          ...current.selectedProfessionals,
          { id: option._id, label: `${option.name} (${option.role})` },
        ],
      };
    });
    setProfessionalTerm("");
    setProfessionalOptions([]);
  }

  function removeProfessional(professionalId) {
    setForm((current) => ({
      ...current,
      selectedProfessionals: current.selectedProfessionals.filter((item) => item.id !== professionalId),
    }));
  }

  async function handleCreateSession(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    setFieldError("");
    const payload = {
      sessionTypeId: form.sessionTypeId,
      modality: form.modality,
      roomId: form.roomId,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : "",
      durationMinutes: Number.parseInt(form.durationMinutes, 10),
      patientIds: form.selectedPatients.map((item) => item.id),
      professionalIds: form.selectedProfessionals.map((item) => item.id),
      notes: form.notes.trim(),
    };
    if (
      !payload.sessionTypeId ||
      !payload.roomId ||
      !payload.startAt ||
      !Number.isFinite(payload.durationMinutes) ||
      payload.durationMinutes <= 0 ||
      payload.patientIds.length === 0 ||
      payload.professionalIds.length === 0
    ) {
      setFieldError("Preencha tipo, sala, início, duração, pacientes e profissionais antes de salvar.");
      setSaving(false);
      return;
    }
    try {
      await createSession(payload);
      closeCreateDialog();
      setSuccess("Sessão criada com sucesso.");
      await loadSessions();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível criar a sessão. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteSession(sessionId) {
    setError("");
    setSuccess("");
    try {
      await completeSession(sessionId);
      setSuccess("Sessão marcada como realizada.");
      await loadSessions();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível concluir a sessão selecionada.",
      );
    }
  }

  async function handleCancelSession(event) {
    event.preventDefault();
    if (!cancelSessionId || !cancelReason.trim()) {
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await cancelSession(cancelSessionId, cancelReason.trim());
      closeCancelDialog();
      setSuccess("Sessão cancelada com sucesso.");
      await loadSessions();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível cancelar a sessão selecionada.",
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    role,
    isAdmin,
    loading,
    saving,
    error,
    success,
    sessions,
    rooms,
    sessionTypes,
    form,
    fieldError,
    createDialogOpen,
    setCreateDialogOpen,
    cancelDialogOpen,
    setCancelDialogOpen,
    cancelReason,
    setCancelReason,
    patientTerm,
    setPatientTerm,
    patientOptions,
    loadingPatients,
    professionalTerm,
    setProfessionalTerm,
    professionalOptions,
    loadingProfessionals,
    loadSessions,
    handleFormChange,
    openCreateDialog,
    closeCreateDialog,
    openCancelDialog,
    closeCancelDialog,
    addPatient,
    removePatient,
    addProfessional,
    removeProfessional,
    handleCreateSession,
    handleCompleteSession,
    handleCancelSession,
  };
}
