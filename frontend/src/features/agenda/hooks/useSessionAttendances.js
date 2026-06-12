import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { isSessionAttendanceDraftValid } from "@/features/agenda/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  listSessionAttendance,
  upsertSessionAttendance,
} from "@/services/patient-attendances";

function buildDraftsFromItems(items) {
  const drafts = {};
  for (const item of items) {
    drafts[item.patient._id] = {
      status: item.current?.status ?? "PRESENTE",
      justification: item.current?.justification ?? "",
    };
  }
  return drafts;
}

function getEffectiveAttendance(draft, saved) {
  return {
    status: draft?.status ?? saved?.status ?? "PRESENTE",
    justification: draft?.justification ?? saved?.justification ?? "",
  };
}

export function useSessionAttendances(sessionId, enabled) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingPatientId, setSavingPatientId] = useState(null);

  const load = useCallback(async () => {
    if (!sessionId || !enabled) {
      return;
    }

    setLoading(true);
    try {
      const data = await listSessionAttendance(sessionId);
      const nextItems = data.items ?? [];
      setItems(nextItems);
      setDrafts(buildDraftsFromItems(nextItems));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Não foi possível carregar a presença da sessão."),
      );
      setItems([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [enabled, sessionId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function setDraftStatus(patientId, status) {
    setDrafts((current) => {
      const previous = current[patientId] ?? { status: "PRESENTE", justification: "" };
      return {
        ...current,
        [patientId]: {
          status,
          justification: status === "FALTA_JUSTIFICADA" ? previous.justification : "",
        },
      };
    });
  }

  function setDraftJustification(patientId, justification) {
    setDrafts((current) => ({
      ...current,
      [patientId]: {
        ...(current[patientId] ?? { status: "PRESENTE", justification: "" }),
        justification,
      },
    }));
  }

  function discardAttendanceChanges(patientId) {
    const savedItem = items.find((item) => item.patient._id === patientId);
    setDrafts((current) => ({
      ...current,
      [patientId]: {
        status: savedItem?.current?.status ?? "PRESENTE",
        justification: savedItem?.current?.justification ?? "",
      },
    }));
  }

  async function saveAttendance(patientId) {
    if (!sessionId) {
      return;
    }

    const draft = drafts[patientId];
    if (!isSessionAttendanceDraftValid(draft)) {
      toast.error("Informe a justificativa para falta justificada.");
      return;
    }

    setSavingPatientId(patientId);
    try {
      const { attendance } = await upsertSessionAttendance(sessionId, patientId, {
        status: draft.status,
        justification: draft.justification ?? "",
      });
      setItems((current) =>
        current.map((item) =>
          item.patient._id === patientId ? { ...item, current: attendance } : item,
        ),
      );
      setDrafts((current) => ({
        ...current,
        [patientId]: {
          status: attendance.status,
          justification: attendance.justification ?? "",
        },
      }));
      toast.success("Presença salva.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível salvar a presença."));
    } finally {
      setSavingPatientId(null);
    }
  }

  const effectiveAttendanceByPatientId = useMemo(() => {
    const byPatientId = {};
    for (const item of items) {
      const patientId = item.patient._id;
      const draft = drafts[patientId];
      const saved = item.current;
      const savedStatus = saved?.status ?? "PRESENTE";
      const savedJustification = saved?.justification ?? "";
      const effective = getEffectiveAttendance(draft, saved);
      const hasUnsaved =
        effective.status !== savedStatus || effective.justification !== savedJustification;
      byPatientId[patientId] = hasUnsaved ? effective : getEffectiveAttendance(null, saved);
    }
    return byPatientId;
  }, [drafts, items]);

  const canCompleteSession = useMemo(() => {
    if (items.length === 0) {
      return true;
    }
    return Object.values(effectiveAttendanceByPatientId).every(isSessionAttendanceDraftValid);
  }, [effectiveAttendanceByPatientId, items.length]);

  const completeBlockedReason = canCompleteSession
    ? ""
    : "Registre a justificativa das faltas justificadas antes de concluir a sessão.";

  return {
    items,
    drafts,
    loading,
    savingPatientId,
    canCompleteSession,
    completeBlockedReason,
    effectiveAttendanceByPatientId,
    setDraftStatus,
    setDraftJustification,
    discardAttendanceChanges,
    saveAttendance,
    reload: load,
  };
}
