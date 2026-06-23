import {
  EntityListPagination,
  formatPaginationSummary,
} from "@/components/cadastros/EntityListPagination";
import { EvolutionHistoryList } from "@/features/patients/components/EvolutionHistoryPanel";
import { usePatientEvolutionHistory } from "@/features/patients/hooks/usePatientEvolutionHistory";

export function EvolutionHistorySection({
  patientId,
  excludeSessionId,
  enabled = true,
  pageSize = 10,
  listClassName = "max-h-56",
  emptyMessage = "Nenhuma evolução registrada para este usuário.",
}) {
  const { items, pagination, loading, error, handlePageChange } = usePatientEvolutionHistory(
    patientId,
    { excludeSessionId, enabled, pageSize },
  );

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-2 overflow-hidden">
      {pagination ? (
        <p className="text-xs text-muted-foreground">{formatPaginationSummary(pagination)}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      ) : (
        <EvolutionHistoryList
          items={items}
          emptyMessage={emptyMessage}
          listClassName={listClassName}
        />
      )}

      <EntityListPagination
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
