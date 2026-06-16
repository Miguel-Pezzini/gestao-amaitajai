import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  listSessionEvolutions,
  upsertSessionEvolution,
} from "@/services/patient-evolutions";

function buildDraftsFromItems(items) {
  const drafts = {};
  for (const item of items) {
    drafts[item.patient._id] = item.current?.content ?? "";
  }
  return drafts;
}

export function useSessionEvolutions(sessionId, enabled) {
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
      const data = await listSessionEvolutions(sessionId);
      const nextItems = data.items ?? [];
      setItems(nextItems);
      setDrafts(buildDraftsFromItems(nextItems));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Não foi possível carregar as evoluções da sessão."),
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

  function setDraftContent(patientId, content) {
    setDrafts((current) => ({ ...current, [patientId]: content }));
  }

  function discardEvolutionChanges(patientId) {
    const savedItem = items.find((item) => item.patient._id === patientId);
    const savedContent = savedItem?.current?.content ?? "";
    setDrafts((current) => ({ ...current, [patientId]: savedContent }));
  }

  async function saveEvolution(patientId) {
    if (!sessionId) {
      return;
    }

    setSavingPatientId(patientId);
    try {
      const { evolution } = await upsertSessionEvolution(sessionId, patientId, drafts[patientId] ?? "");
      setItems((current) =>
        current.map((item) =>
          item.patient._id === patientId ? { ...item, current: evolution } : item,
        ),
      );
      setDrafts((current) => ({ ...current, [patientId]: evolution.content ?? "" }));
      toast.success("Evolução salva.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível salvar a evolução."));
    } finally {
      setSavingPatientId(null);
    }
  }

  return {
    items,
    drafts,
    loading,
    savingPatientId,
    setDraftContent,
    discardEvolutionChanges,
    saveEvolution,
    reload: load,
  };
}
