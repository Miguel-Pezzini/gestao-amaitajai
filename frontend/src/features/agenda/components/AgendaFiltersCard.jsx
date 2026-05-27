import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { STATUS_OPTIONS } from "@/features/agenda/constants";

export function AgendaFiltersCard({
  scheduledCount,
  totalSessions,
  canCreateSession,
  onOpenCreate,
  statusFilter,
  setStatusFilter,
  startFilter,
  setStartFilter,
  endFilter,
  setEndFilter,
  professionalFilter,
  setProfessionalFilter,
  isAdmin,
  onApplyFilters,
  loading,
}) {
  return (
    <Card className="border-ama-cyan/30">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base text-ama-blue-dark">Filtros e ações</CardTitle>
            <CardDescription>
              {scheduledCount} sessão(ões) agendada(s) em {totalSessions} registro(s).
            </CardDescription>
          </div>
          {canCreateSession ? (
            <Button className="bg-ama-blue text-white hover:bg-ama-blue-dark" onClick={onOpenCreate}>
              Nova sessão
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <Input type="datetime-local" value={startFilter} onChange={(e) => setStartFilter(e.target.value)} />
          <Input type="datetime-local" value={endFilter} onChange={(e) => setEndFilter(e.target.value)} />
          <Input
            value={professionalFilter}
            onChange={(e) => setProfessionalFilter(e.target.value)}
            placeholder="ID do profissional (admin)"
            disabled={!isAdmin}
          />
        </div>

        <Button
          variant="outline"
          className="w-full border-ama-cyan text-ama-blue hover:bg-ama-light sm:w-auto"
          onClick={onApplyFilters}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Aplicar filtros"}
        </Button>
      </CardHeader>
    </Card>
  );
}
