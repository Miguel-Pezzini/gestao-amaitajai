import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EntityListPagination,
  formatPaginationSummary,
} from "@/components/cadastros/EntityListPagination";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SELECT_ALL_VALUE } from "@/constants/select";
import { STATUS_OPTIONS } from "@/features/agenda/constants";
import { SessionParticipantsPreview } from "@/features/agenda/components/SessionParticipants";
import {
  formatSessionDateTime,
  getSessionStatusLabel,
  sessionSummary,
  statusBadgeClass,
} from "@/features/agenda/utils";
import { listPatientSessions } from "@/services/agenda";

const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS = [
  { value: SELECT_ALL_VALUE, label: "Todos os status" },
  ...STATUS_OPTIONS.map((status) => ({
    value: status,
    label: getSessionStatusLabel(status),
  })),
];

const EMPTY_FILTERS = {
  status: SELECT_ALL_VALUE,
  startAt: "",
  endAt: "",
};

function buildQueryParams(activeFilters, targetPage) {
  const params = {
    page: targetPage,
    limit: PAGE_SIZE,
  };

  if (activeFilters.status && activeFilters.status !== SELECT_ALL_VALUE) {
    params.status = activeFilters.status;
  }
  if (activeFilters.startAt && activeFilters.endAt) {
    params.startAt = new Date(`${activeFilters.startAt}T00:00:00`).toISOString();
    params.endAt = new Date(`${activeFilters.endAt}T23:59:59`).toISOString();
  }

  return params;
}

export function PatientSessionsDialog({ patient, open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  async function loadSessions(activeFilters = filters, targetPage = page) {
    if (!patient?._id) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await listPatientSessions(
        patient._id,
        buildQueryParams(activeFilters, targetPage),
      );
      setSessions(response.items ?? []);
      setPagination(response.pagination ?? null);
      setPage(targetPage);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar as sessões deste paciente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setFilters(EMPTY_FILTERS);
      setPage(1);
      setPagination(null);
      setSessions([]);
      setError("");
      return;
    }

    loadSessions(EMPTY_FILTERS, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient?._id]);

  function handleFilterChange(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    loadSessions(filters, 1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    loadSessions(EMPTY_FILTERS, 1);
  }

  function handlePageChange(nextPage) {
    loadSessions(filters, nextPage);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Sessões — ${patient?.fullName ?? ""}`}
      description="Histórico de atendimentos agendados, realizados e cancelados."
      className="sm:max-w-3xl"
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleApplyFilters}
          className="grid gap-3 rounded-lg border border-ama-cyan/20 bg-ama-light/20 p-4 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="patient-session-status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger id="patient-session-status" className="w-full">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-session-start">De</Label>
            <Input
              id="patient-session-start"
              type="date"
              value={filters.startAt}
              onChange={(event) => handleFilterChange("startAt", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-session-end">Até</Label>
            <Input
              id="patient-session-end"
              type="date"
              value={filters.endAt}
              onChange={(event) => handleFilterChange("endAt", event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
            <Button type="submit" className="bg-ama-blue text-white hover:bg-ama-blue-dark">
              Filtrar
            </Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
          </div>
        </form>

        {pagination ? (
          <p className="text-sm text-muted-foreground">{formatPaginationSummary(pagination)}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando sessões...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma sessão encontrada para os filtros informados.
          </p>
        ) : (
          <div className="max-h-[28rem] space-y-2.5 overflow-y-auto pr-1">
            {sessions.map((session) => {
              const cancelReason = String(session.cancelReason ?? "").trim();
              return (
                <article
                  key={session._id}
                  className="rounded-xl border border-ama-cyan/20 bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-ama-blue-dark">{sessionSummary(session)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSessionDateTime(session.startAt)}
                        {" — "}
                        {formatSessionDateTime(session.endAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass(session.status)}>
                      {getSessionStatusLabel(session.status)}
                    </Badge>
                  </div>

                  <div className="mt-2">
                    <SessionParticipantsPreview session={session} />
                  </div>

                  {session.notes ? (
                    <p className="mt-2 text-sm text-ama-blue-dark">
                      <span className="font-medium text-muted-foreground">Notas:</span> {session.notes}
                    </p>
                  ) : null}

                  {session.status === "CANCELADA" && cancelReason ? (
                    <p className="mt-2 text-sm text-destructive">
                      <span className="font-medium">Motivo:</span> {cancelReason}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        <EntityListPagination
          pagination={pagination}
          loading={loading}
          onPageChange={handlePageChange}
        />
      </div>
    </Dialog>
  );
}
