import { useCallback, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { buildReplacementPayload } from "@/features/patients/utils/deactivation";
import { getApiErrorMessage } from "@/lib/api-error";
import { getPatientDeactivationImpact, updatePatientStatus } from "@/services/patients";

export function usePatientDeactivation({ onCompleted }) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patient, setPatient] = useState(null);
  const [impact, setImpact] = useState(null);
  const [selections, setSelections] = useState({});
  const [selectionLabels, setSelectionLabels] = useState({});
  const [selectionErrors, setSelectionErrors] = useState({});
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetState = useCallback(() => {
    setDialogOpen(false);
    setPatient(null);
    setImpact(null);
    setSelections({});
    setSelectionLabels({});
    setSelectionErrors({});
    setLoadingImpact(false);
    setSaving(false);
    setError("");
  }, []);

  const closeDialog = useCallback(() => {
    if (saving) {
      return;
    }
    resetState();
  }, [resetState, saving]);

  const startDeactivation = useCallback(
    async (selectedPatient) => {
      setError("");
      setLoadingImpact(true);

      try {
        const impactResult = await getPatientDeactivationImpact(selectedPatient._id);

        if (!impactResult.requiresReplacement) {
          setSaving(true);
          const result = await updatePatientStatus(selectedPatient._id, false);
          const cancelled = result.sessionsCancelled ?? 0;
          const replaced = result.sessionsReplaced ?? 0;

          if (cancelled > 0 && replaced > 0) {
            toast.success(
              `Paciente inativado. ${cancelled} sessão(ões) cancelada(s) e ${replaced} substituída(s).`,
            );
          } else if (cancelled > 0) {
            toast.success(`Paciente inativado. ${cancelled} sessão(ões) cancelada(s).`);
          } else if (replaced > 0) {
            toast.success(`Paciente inativado. ${replaced} sessão(ões) com paciente substituído.`);
          } else {
            toast.success("Paciente inativado com sucesso.");
          }

          await onCompleted?.();
          resetState();
          return;
        }

        setPatient(selectedPatient);
        setImpact(impactResult);
        setSelections({});
        setSelectionLabels({});
        setSelectionErrors({});
        setDialogOpen(true);
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, "Não foi possível preparar a inativação do paciente."),
        );
      } finally {
        setLoadingImpact(false);
        setSaving(false);
      }
    },
    [onCompleted, resetState, toast],
  );

  const handleSelectionChange = useCallback((key, selectedPatient) => {
    setSelections((current) => ({
      ...current,
      [key]: selectedPatient?._id ?? "",
    }));
    setSelectionLabels((current) => ({
      ...current,
      [key]: selectedPatient?.fullName ?? "",
    }));
    setSelectionErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const confirmDeactivation = useCallback(async () => {
    if (!patient || !impact) {
      return;
    }

    const replacements = impact.replacements ?? [];
    const nextSelectionErrors = {};

    for (const item of replacements) {
      if (!selections[item.key]) {
        nextSelectionErrors[item.key] = "Selecione o paciente substituto.";
      }
    }

    if (Object.keys(nextSelectionErrors).length > 0) {
      setSelectionErrors(nextSelectionErrors);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await updatePatientStatus(patient._id, false, {
        replacements: buildReplacementPayload(replacements, selections),
      });

      const cancelled = result.sessionsCancelled ?? 0;
      const replaced = result.sessionsReplaced ?? 0;

      if (cancelled > 0 && replaced > 0) {
        toast.success(
          `Paciente inativado. ${cancelled} sessão(ões) cancelada(s) e ${replaced} substituída(s).`,
        );
      } else if (replaced > 0) {
        toast.success(`Paciente inativado. ${replaced} sessão(ões) com paciente substituído.`);
      } else {
        toast.success("Paciente inativado com sucesso.");
      }

      await onCompleted?.();
      resetState();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível inativar o paciente com as substituições informadas."),
      );
    } finally {
      setSaving(false);
    }
  }, [impact, onCompleted, patient, resetState, selections, toast]);

  const handleToggleStatus = useCallback(
    async (selectedPatient) => {
      if (!selectedPatient.isActive) {
        setSaving(true);
        setError("");
        try {
          await updatePatientStatus(selectedPatient._id, true);
          toast.success("Paciente reativado com sucesso.");
          await onCompleted?.();
        } catch (err) {
          toast.error(
            getApiErrorMessage(err, "Não foi possível atualizar o status do paciente."),
          );
        } finally {
          setSaving(false);
        }
        return;
      }

      await startDeactivation(selectedPatient);
    },
    [onCompleted, startDeactivation, toast],
  );

  return {
    dialogOpen,
    patient,
    impact,
    selections,
    selectionLabels,
    selectionErrors,
    loadingImpact,
    saving,
    error,
    closeDialog,
    handleSelectionChange,
    confirmDeactivation,
    handleToggleStatus,
  };
}
