import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { CalendarDaySessions } from "@/features/agenda/components/CalendarDaySessions";
import { SessionDetailDialog } from "@/features/agenda/components/SessionDetailDialog";
import { SessionParticipantsPreview } from "@/features/agenda/components/SessionParticipants";
import {
  formatDayFull,
  formatDayNumber,
  formatSessionTime,
  groupSessionsByDay,
  isWeekend,
  monthLabel,
  getSessionStatusLabel,
  sessionSummary,
  sortSessionsByStart,
  statusBadgeClass,
  toCalendarKey,
  WEEKDAY_HEADERS,
} from "@/features/agenda/utils";

function buildMonthGrid(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  const leadingEmpty = firstDay.getDay();
  const emptyCells = Array.from({ length: leadingEmpty }, (_, idx) => `empty-${idx}`);
  return { days, emptyCells };
}

function SessionCard({ session, onOpenSession, onCompleteSession, onCancelSession, isAdmin }) {
  const canComplete = session.status === "agendada";
  const canCancel = isAdmin && session.status !== "cancelada";
  const hasActions = canComplete || canCancel;

  return (
    <li className="flex items-start gap-2 px-2 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
      <button
        type="button"
        onClick={() => onOpenSession(session)}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-md px-1 py-1 text-left transition hover:bg-ama-light/50 sm:gap-4"
      >
        <time
          dateTime={session.startAt}
          className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-ama-blue-dark sm:w-14"
        >
          {formatSessionTime(session.startAt)}
        </time>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-ama-blue-dark">{sessionSummary(session)}</p>
          <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(session.status)}`}>
            {getSessionStatusLabel(session.status)}
          </Badge>
          <SessionParticipantsPreview session={session} />
          <p className="text-[10px] text-muted-foreground">Clique para ver detalhes</p>
        </div>

        <ChevronRight
          className="mt-1 size-4 shrink-0 text-muted-foreground/60"
          aria-hidden="true"
        />
      </button>

      {hasActions ? (
        <div className="flex shrink-0 flex-col items-stretch gap-0.5 pt-1">
          {canComplete ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-ama-blue-dark hover:bg-ama-light hover:text-ama-blue-dark"
              onClick={() => onCompleteSession(session._id)}
              aria-label="Concluir sessão"
              title="Concluir"
            >
              <Check className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Concluir</span>
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onCancelSession(session._id)}
              aria-label="Cancelar sessão"
              title="Cancelar"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function WeekdayCell({ date, items, onOpenDay }) {
  return (
    <button
      type="button"
      onClick={() => onOpenDay(date)}
      className="flex min-h-16 flex-col gap-0.5 rounded-md border border-ama-cyan/25 bg-white p-1 text-left transition hover:border-ama-cyan hover:bg-ama-light/40 sm:min-h-24 sm:gap-1 sm:p-1.5 lg:min-h-32 lg:p-2"
    >
      <p className="shrink-0 text-[11px] font-semibold leading-none text-ama-blue-dark sm:text-sm">
        {formatDayNumber(date)}
      </p>
      <CalendarDaySessions sessions={items} />
    </button>
  );
}

function WeekendCell({ date }) {
  return (
    <div
      className="flex min-h-16 flex-col rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-1 sm:min-h-24 sm:p-1.5 lg:min-h-32 lg:p-2"
      aria-hidden
    >
      <p className="text-[11px] font-medium text-muted-foreground/70 sm:text-sm">
        {formatDayNumber(date)}
      </p>
    </div>
  );
}

function EmptyLeadingCell() {
  return (
    <div className="min-h-16 rounded-md border border-dashed border-transparent sm:min-h-24 lg:min-h-32" />
  );
}

export function AgendaCalendarView({
  sessions,
  currentMonth,
  setCurrentMonth,
  onCompleteSession,
  onCancelSession,
  onOpenCreate,
  isAdmin,
}) {
  const grouped = groupSessionsByDay(sessions);
  const { days, emptyCells } = buildMonthGrid(currentMonth);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) {
      return [];
    }
    const key = toCalendarKey(selectedDay);
    return sortSessionsByStart(grouped[key] ?? []);
  }, [grouped, selectedDay]);

  function openDayDialog(date) {
    setSelectedDay(date);
    setDayDialogOpen(true);
  }

  function openSessionDetail(session) {
    setSelectedSession(session);
    setSessionDetailOpen(true);
  }

  function closeSessionDetail() {
    setSessionDetailOpen(false);
    setSelectedSession(null);
  }

  return (
    <Card className="border-ama-cyan/30">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="min-w-[10rem] text-center text-sm font-medium capitalize sm:min-w-[12rem] sm:text-base">
            {monthLabel(currentMonth)}
          </p>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase sm:gap-1 sm:text-xs">
          {WEEKDAY_HEADERS.map((label, index) => (
            <span
              key={label}
              className={
                index === 0 || index === 6
                  ? "text-muted-foreground/50"
                  : "text-ama-blue-dark"
              }
            >
              {label}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-7 gap-0.5 p-2 sm:gap-1 sm:p-4">
        {emptyCells.map((key) => (
          <EmptyLeadingCell key={key} />
        ))}
        {days.map((date) => {
          const key = toCalendarKey(date);
          if (isWeekend(date)) {
            return <WeekendCell key={key} date={date} />;
          }
          const items = grouped[key] ?? [];
          return (
            <WeekdayCell
              key={key}
              date={date}
              items={items}
              onOpenDay={openDayDialog}
            />
          );
        })}
      </CardContent>

      <Dialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        title={selectedDay ? formatDayFull(selectedDay) : "Sessões do dia"}
        description={
          selectedDayItems.length > 0
            ? `${selectedDayItems.length} sessão(ões) neste dia. Clique em uma sessão para ver todos os detalhes.`
            : "Nenhuma sessão agendada para este dia."
        }
        headerAction={
          isAdmin ? (
            <Button
              type="button"
              size="sm"
              className="bg-ama-blue text-white hover:bg-ama-blue-dark"
              onClick={() => {
                setDayDialogOpen(false);
                onOpenCreate(selectedDay);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova sessão
            </Button>
          ) : null
        }
        className="sm:max-w-2xl"
      >
        {selectedDayItems.length === 0 ? (
          isAdmin ? (
            <div className="rounded-lg border border-dashed border-ama-cyan/30 bg-ama-light/30 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 border-ama-cyan/40"
                onClick={() => {
                  setDayDialogOpen(false);
                  onOpenCreate(selectedDay);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Agendar sessão
              </Button>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
          )
        ) : (
          <ul className="divide-y divide-ama-cyan/15 overflow-hidden rounded-lg border border-ama-cyan/20 bg-white">
            {selectedDayItems.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                onOpenSession={openSessionDetail}
                onCompleteSession={onCompleteSession}
                onCancelSession={onCancelSession}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </Dialog>

      <SessionDetailDialog
        open={sessionDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSessionDetail();
            return;
          }
          setSessionDetailOpen(true);
        }}
        session={selectedSession}
        isAdmin={isAdmin}
        onCompleteSession={onCompleteSession}
        onCancelSession={onCancelSession}
      />
    </Card>
  );
}
