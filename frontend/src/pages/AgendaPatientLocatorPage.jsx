import { useEffect, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SessionParticipantsPreview } from "@/features/agenda/components/SessionParticipants";
import {
  formatSessionDateTime,
  getSessionRoomName,
  getSessionStatusLabel,
  sessionSummary,
  statusBadgeClass,
} from "@/features/agenda/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { listSessions, searchAgendaPatients } from "@/services/agenda";

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AgendaPatientLocatorPage() {
  const [date, setDate] = useState(() => toDateInputValue());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError("");
      setSearched(false);
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError("");
      setSearched(true);

      const startAt = new Date(`${date}T00:00:00`).toISOString();
      const endAt = new Date(`${date}T23:59:59`).toISOString();

      try {
        const patientsResponse = await searchAgendaPatients({ q: trimmed, limit: 10 });
        const patients = patientsResponse.items ?? [];

        if (patients.length === 0) {
          setResults([]);
          return;
        }

        const sessionsByPatient = await Promise.all(
          patients.map(async (patient) => {
            const response = await listSessions({
              patientId: patient._id,
              startAt,
              endAt,
            });
            const sessions = (response.items ?? []).sort(
              (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
            );
            return { patient, sessions };
          }),
        );

        setResults(sessionsByPatient);
      } catch (err) {
        setResults([]);
        setError(getApiErrorMessage(err, "Não foi possível buscar os atendimentos."));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, date]);

  const today = toDateInputValue();
  const hasQuery = query.trim().length >= 2;

  return (
    <div className="space-y-6">
      <Card className="border-ama-cyan/30">
        <CardHeader>
          <CardTitle className="text-xl text-ama-text">Localizar usuário</CardTitle>
          <CardDescription>
            Busque pelo nome da criança ou do responsável para ver sala e profissional no dia
            selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locator-date">Data</Label>
            <Input
              id="locator-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locator-query">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="locator-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome da criança ou responsável"
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? <InlineAlert variant="destructive">{error}</InlineAlert> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Buscando atendimentos...</p>
      ) : !hasQuery ? (
        <EmptyState
          icon={Search}
          title="Digite para buscar"
          description="Informe pelo menos 2 caracteres do nome da criança ou do responsável."
        />
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum resultado"
          description="Nenhum usuário encontrado com esse nome."
        />
      ) : (
        <div className="space-y-4">
          {results.map(({ patient, sessions }) => {
            if (sessions.length === 0) {
              return (
                <Card key={patient._id} className="border-ama-cyan/20">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base text-ama-blue-dark">{patient.fullName}</CardTitle>
                    <CardDescription>Nenhuma sessão agendada neste dia.</CardDescription>
                  </CardHeader>
                </Card>
              );
            }

            return sessions.map((session) => {
              const now = Date.now();
              const inProgress =
                date === today &&
                now >= new Date(session.startAt).getTime() &&
                now < new Date(session.endAt).getTime();

              return (
                <Card key={`${patient._id}-${session._id}`} className="border-ama-cyan/20">
                  <CardHeader className="gap-3 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base text-ama-blue-dark">{patient.fullName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{sessionSummary(session)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatSessionDateTime(session.startAt)}
                          {" — "}
                          {formatSessionDateTime(session.endAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {inProgress ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            Em andamento
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className={statusBadgeClass(session.status)}>
                          {getSessionStatusLabel(session.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4 pt-0">
                    <p className="flex items-center gap-2 text-base font-semibold text-ama-blue-dark">
                      <MapPin className="size-4 shrink-0 text-ama-cyan" />
                      {getSessionRoomName(session)}
                    </p>
                    <SessionParticipantsPreview session={session} />
                  </CardContent>
                </Card>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}
