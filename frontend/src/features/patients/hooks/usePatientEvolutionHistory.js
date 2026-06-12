import { useCallback, useEffect, useState } from "react";
import { listPatientEvolutions } from "@/services/patient-evolutions";

export function usePatientEvolutionHistory(
  patientId,
  { excludeSessionId, enabled = true, pageSize = 10 } = {},
) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (targetPage = 1) => {
      if (!patientId || !enabled) {
        return;
      }

      setLoading(true);
      setError("");
      try {
        const params = {
          page: targetPage,
          limit: pageSize,
        };
        if (excludeSessionId) {
          params.excludeSessionId = excludeSessionId;
        }

        const response = await listPatientEvolutions(patientId, params);
        setItems(response.items ?? []);
        setPagination(response.pagination ?? null);
        setPage(targetPage);
      } catch (err) {
        setError(
          err.response?.data?.message ?? "Não foi possível carregar o histórico de evoluções.",
        );
        setItems([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [enabled, excludeSessionId, pageSize, patientId],
  );

  useEffect(() => {
    if (!enabled || !patientId) {
      setItems([]);
      setPagination(null);
      setPage(1);
      setError("");
      return;
    }

    load(1);
  }, [enabled, patientId, load]);

  function handlePageChange(nextPage) {
    load(nextPage);
  }

  return {
    items,
    pagination,
    page,
    loading,
    error,
    reload: load,
    handlePageChange,
  };
}
