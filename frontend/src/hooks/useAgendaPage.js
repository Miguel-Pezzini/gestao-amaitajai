import { useEffect, useState } from "react";
import {
  cancelSession,
  completeSession,
  createSession,
  listRooms,
  listSessions,
  listSessionModalities,
  listSessionTypes,
  searchAgendaPatients,
  searchAgendaProfessionals,
} from "@/services/agenda";
import { useToast } from "@/contexts/toast-context";
import {
  buildInitialSessionForm,
  DEFAULT_SESSION_START_TIME,
  buildSessionLimitsMap,
  canAddSessionPatient,
  canAddSessionProfessional,
  getParticipantFieldErrors,
  getSessionFormFieldErrors,
  pickDefaultCatalogId,
} from "@/features/agenda/constants";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  combineStartDateTime,
  getSessionFormSlotQuery,
  normalizeRole,
  splitStartDateTime,
} from "@/features/agenda/utils";

const EMPTY_FIELD_ERRORS = {};

export function useAgendaPage(user) {
  const toast = useToast();
  const role = normalizeRole(user?.role);
  const isAdmin = role === "ADMINISTRADOR";

  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);
  const [sessionModalitySettings, setSessionModalitySettings] = useState([]);

  const [form, setForm] = useState(() => buildInitialSessionForm());
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");

  const [patientTerm, setPatientTerm] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [professionalRoster, setProfessionalRoster] = useState([]);
  const [professionalAvailabilityMeta, setProfessionalAvailabilityMeta] = useState(null);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);

  const participantSlotReady = Boolean(getSessionFormSlotQuery(form));

  const sessionLimits = buildSessionLimitsMap(sessionModalitySettings);

  function getAllowedModalitiesBySessionType(sessionTypeId) {
    const selected = sessionTypes.find((item) => item._id === sessionTypeId);
    const allowed = selected?.allowedModalities?.length ? selected.allowedModalities : [];
    return allowed;
  }

  async function loadDependencies() {
    const [roomsResponse, typesResponse, modalitySettingsResponse] = await Promise.all([
      listRooms(),
      listSessionTypes(),
      listSessionModalities(),
    ]);
    setRooms(roomsResponse.items ?? []);
    setSessionTypes(typesResponse.items ?? []);
    setSessionModalitySettings(modalitySettingsResponse.items ?? []);
  }

  async function loadSessions(options = {}) {
    const { showLoading = true } = options;
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await listSessions();
      setSessions(response.items ?? []);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Não foi possível carregar as sessões. Tente novamente."),
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!createDialogOpen || catalogsLoaded) {
      return;
    }

    let mounted = true;

    async function loadCatalogs() {
      setLoadingCatalogs(true);
      try {
        await loadDependencies();
        if (mounted) {
          setCatalogsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          toast.error(
            getApiErrorMessage(
              err,
              "Não foi possível carregar os dados para criar sessão. Tente novamente.",
            ),
          );
          setCreateDialogOpen(false);
        }
      } finally {
        if (mounted) {
          setLoadingCatalogs(false);
        }
      }
    }

    loadCatalogs();

    return () => {
      mounted = false;
    };
  }, [createDialogOpen, catalogsLoaded]);

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

    const slot = getSessionFormSlotQuery(form);
    if (!slot) {
      setProfessionalRoster([]);
      setProfessionalAvailabilityMeta(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoadingProfessionals(true);
      try {
        const response = await searchAgendaProfessionals({
          ...slot,
          availableOnly: "false",
        });
        setProfessionalRoster(response.items ?? []);
        setProfessionalAvailabilityMeta(response.meta ?? null);
      } catch {
        setProfessionalRoster([]);
        setProfessionalAvailabilityMeta(null);
      } finally {
        setLoadingProfessionals(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [createDialogOpen, form.startDate, form.startTime, form.durationMinutes]);

  function clearFieldError(field) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleFormChange(field, value) {
    clearFieldError(field);
    if (field === "sessionTypeId") {
      const allowed = getAllowedModalitiesBySessionType(value);
      setForm((current) => {
        const nextModality = allowed.includes(current.modality) ? current.modality : allowed[0] ?? current.modality;
        return { ...current, sessionTypeId: value, modality: nextModality };
      });
      clearFieldError("modality");
      return;
    }
    if (field === "modality") {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.patients;
        delete next.professionals;
        return next;
      });
    }
    if (field === "startDate" || field === "startTime") {
      clearFieldError("startAt");
    }
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetCreateForm() {
    setForm(buildInitialSessionForm(sessionTypes, rooms));
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setPatientTerm("");
    setPatientOptions([]);
    setProfessionalRoster([]);
    setProfessionalAvailabilityMeta(null);
  }

  function closeCreateDialog() {
    setCreateDialogOpen(false);
    resetCreateForm();
  }

  function openCreateDialog(day, startTime = DEFAULT_SESSION_START_TIME) {
    if (day) {
      const { startDate } = splitStartDateTime(day);
      setForm(
        buildInitialSessionForm(sessionTypes, rooms, {
          startDate,
          startTime,
        }),
      );
      setPatientTerm("");
      setPatientOptions([]);
      setProfessionalRoster([]);
      setProfessionalAvailabilityMeta(null);
      setFieldErrors(EMPTY_FIELD_ERRORS);
    } else {
      resetCreateForm();
    }
    setCreateDialogOpen(true);
  }

  useEffect(() => {
    if (!createDialogOpen) {
      return;
    }
    setForm((current) => {
      const sessionTypeId = current.sessionTypeId || pickDefaultCatalogId(sessionTypes);
      const roomId = current.roomId || pickDefaultCatalogId(rooms);
      const allowed = getAllowedModalitiesBySessionType(sessionTypeId);
      const modality = allowed.includes(current.modality) ? current.modality : allowed[0] ?? current.modality;
      if (
        sessionTypeId === current.sessionTypeId &&
        roomId === current.roomId &&
        modality === current.modality
      ) {
        return current;
      }
      return { ...current, sessionTypeId, roomId, modality };
    });
  }, [createDialogOpen, sessionTypes, rooms]);

  function openCancelDialog(sessionId) {
    setCancelSessionId(sessionId);
    setCancelReason("");
    setCancelReasonError("");
    setCancelDialogOpen(true);
  }

  function closeCancelDialog() {
    setCancelDialogOpen(false);
    setCancelSessionId("");
    setCancelReason("");
    setCancelReasonError("");
  }

  function handleCancelReasonChange(value) {
    setCancelReason(value);
    if (value.trim()) {
      setCancelReasonError("");
    }
  }

  function addPatient(option) {
    const nextPatientCount = form.selectedPatients.length + 1;
    if (!canAddSessionPatient(form.modality, form.selectedPatients.length, sessionLimits)) {
      const errors = getParticipantFieldErrors(
        form.modality,
        nextPatientCount,
        form.selectedProfessionals.length,
        sessionLimits,
      );
      setFieldErrors((current) => ({
        ...current,
        patients: errors.patients ?? "Limite de pacientes atingido para este tipo de sessão.",
      }));
      return;
    }

    setForm((current) => {
      if (current.selectedPatients.some((item) => item.id === option._id)) {
        return current;
      }
      return {
        ...current,
        selectedPatients: [...current.selectedPatients, { id: option._id, label: option.fullName }],
      };
    });
    clearFieldError("patients");
  }

  function removePatient(patientId) {
    setForm((current) => ({
      ...current,
      selectedPatients: current.selectedPatients.filter((item) => item.id !== patientId),
    }));
    clearFieldError("patients");
  }

  function addProfessional(option) {
    const nextProfessionalCount = form.selectedProfessionals.length + 1;
    if (!canAddSessionProfessional(form.modality, form.selectedProfessionals.length, sessionLimits)) {
      const errors = getParticipantFieldErrors(
        form.modality,
        form.selectedPatients.length,
        nextProfessionalCount,
        sessionLimits,
      );
      setFieldErrors((current) => ({
        ...current,
        professionals:
          errors.professionals ?? "Limite de profissionais atingido para este tipo de sessão.",
      }));
      return;
    }

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
    clearFieldError("professionals");
  }

  function removeProfessional(professionalId) {
    setForm((current) => ({
      ...current,
      selectedProfessionals: current.selectedProfessionals.filter((item) => item.id !== professionalId),
    }));
    clearFieldError("professionals");
  }

  async function handleCreateSession(event) {
    event.preventDefault();
    setSaving(true);

    const errors = getSessionFormFieldErrors(form, sessionLimits);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    setFieldErrors(EMPTY_FIELD_ERRORS);

    const payload = {
      sessionTypeId: form.sessionTypeId,
      modality: form.modality,
      roomId: form.roomId,
      startAt: new Date(combineStartDateTime(form.startDate, form.startTime)).toISOString(),
      durationMinutes: Number.parseInt(form.durationMinutes, 10),
      patientIds: form.selectedPatients.map((item) => item.id),
      professionalIds: form.selectedProfessionals.map((item) => item.id),
      notes: form.notes.trim(),
    };

    try {
      await createSession(payload);
      closeCreateDialog();
      toast.success("Sessão criada com sucesso.");
      await loadSessions();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Não foi possível criar a sessão. Verifique os dados e tente novamente.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteSession(sessionId) {
    try {
      await completeSession(sessionId);
      toast.success("Sessão marcada como realizada.");
      await loadSessions();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Não foi possível concluir a sessão selecionada."),
      );
    }
  }

  async function handleCancelSession(event) {
    event.preventDefault();
    if (!cancelSessionId || !cancelReason.trim()) {
      setCancelReasonError("Informe o motivo do cancelamento.");
      return;
    }
    setCancelReasonError("");
    setSaving(true);
    try {
      await cancelSession(cancelSessionId, cancelReason.trim());
      closeCancelDialog();
      toast.success("Sessão cancelada com sucesso.");
      await loadSessions();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Não foi possível cancelar a sessão selecionada."),
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    role,
    isAdmin,
    loading,
    loadingCatalogs,
    saving,
    sessions,
    rooms,
    sessionTypes,
    sessionModalitySettings,
    form,
    fieldErrors,
    createDialogOpen,
    setCreateDialogOpen,
    cancelDialogOpen,
    setCancelDialogOpen,
    cancelReason,
    cancelReasonError,
    handleCancelReasonChange,
    patientTerm,
    setPatientTerm,
    patientOptions,
    loadingPatients,
    participantSlotReady,
    professionalRoster,
    professionalAvailabilityMeta,
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
