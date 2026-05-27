import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { CalendarDaySessions } from "@/features/agenda/components/CalendarDaySessions";
import {
  formatDateTime,
  formatDayNumber,
  groupSessionsByDay,
  isWeekend,
  monthLabel,
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

function SessionCard({ session, onCompleteSession, onCancelSession, isAdmin }) {
  return (
    <div className="rounded border border-ama-cyan/20 p-2">
      <p className="text-xs font-semibold text-ama-blue-dark">{sessionSummary(session)}</p>
      <p className="text-xs text-muted-foreground">{formatDateTime(session.startAt)}</p>
      <Badge variant="outline" className={`mt-1 ${statusBadgeClass(session.status)}`}>
        {session.status}
      </Badge>
      <div className="mt-2 flex flex-col gap-1">
        {session.status === "agendada" ? (
          <Button size="sm" variant="outline" onClick={() => onCompleteSession(session._id)}>
            Concluir
          </Button>
        ) : null}
        {isAdmin && session.status !== "cancelada" ? (
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onCancelSession(session._id)}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
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
        title={
          selectedDay
            ? `Sessões do dia ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(selectedDay)}`
            : "Sessões do dia"
        }
        description="Clique em uma ação para concluir ou cancelar, e use o botão para criar nova sessão."
        className="sm:max-w-2xl"
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            {isAdmin ? (
              <Button
                className="bg-ama-blue text-white hover:bg-ama-blue-dark"
                onClick={() => {
                  setDayDialogOpen(false);
                  onOpenCreate(selectedDay);
                }}
              >
                Criar sessão
              </Button>
            ) : null}
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem sessões neste dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  onCompleteSession={onCompleteSession}
                  onCancelSession={onCancelSession}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </Card>
  );
}
