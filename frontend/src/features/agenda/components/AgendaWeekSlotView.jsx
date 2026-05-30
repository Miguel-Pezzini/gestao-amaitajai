import { CardContent } from "@/components/ui/card";
import { AgendaWeekSlotChip } from "@/features/agenda/components/AgendaWeekSlotChip";
import { CalendarDayNumber } from "@/features/agenda/components/CalendarDayNumber";
import {
  buildWeekDays,
  formatWeekdayShort,
  isToday,
  isWeekend,
  toCalendarKey,
} from "@/features/agenda/utils";
import {
  buildWeekTimeSlotKeys,
  formatTimeSlotLabel,
  getSessionsAtTimeSlot,
} from "@/features/agenda/utils/weekSlotMatrix";
import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_START_HOUR,
} from "@/features/room-occupancy/constants";
import { formatHourLabel } from "@/features/room-occupancy/utils";
import { cn } from "@/lib/utils";

const WEEKDAY_HEADER_HOVER =
  "rounded-md border border-ama-cyan/25 bg-white transition hover:border-ama-cyan hover:bg-ama-light/40";

function weekDayHeaderClass(today) {
  return cn(
    WEEKDAY_HEADER_HOVER,
    today && "border-ama-blue bg-ama-light/60 ring-1 ring-ama-blue/30",
  );
}

function WeekDayHeader({ date, onOpenDay }) {
  const today = isToday(date);
  const weekend = isWeekend(date);
  const weekday = formatWeekdayShort(date);

  const content = (
    <div className="flex flex-col items-center gap-1 py-1">
      <span
        className={cn(
          "text-[11px] font-semibold uppercase sm:text-xs",
          weekend ? "text-muted-foreground/50" : today ? "text-ama-blue" : "text-ama-blue-dark",
        )}
      >
        <span className="sm:hidden">{weekday.charAt(0)}</span>
        <span className="hidden sm:inline">{weekday}</span>
      </span>
      <CalendarDayNumber date={date} className="!size-7 !text-xs sm:!size-8 sm:!text-sm" />
    </div>
  );

  if (weekend || !onOpenDay) {
    return (
      <div
        className={cn(
          "min-w-[7.5rem] px-1",
          weekend && "bg-muted/20",
          today && !weekend && "bg-ama-light/60",
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenDay(date)}
      className={cn(
        "min-w-[7.5rem] w-full px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ama-blue/40",
        weekDayHeaderClass(today),
      )}
    >
      {content}
    </button>
  );
}

function WeekSlotCell({ date, timeKey, sessions, onOpenSession, onOpenCreate, isAdmin }) {
  const weekend = isWeekend(date);
  const today = isToday(date);
  const canCreate = isAdmin && onOpenCreate && !weekend;

  function handleCreate(event) {
    event.stopPropagation();
    onOpenCreate(date, timeKey);
  }

  if (weekend) {
    return (
      <td
        className={cn(
          "h-8 min-w-[7.5rem] border-l border-dashed border-ama-cyan/15 bg-muted/10 align-top",
          today && "bg-muted/20",
        )}
      />
    );
  }

  const cellClassName = cn(
    "relative min-w-[7.5rem] border-l border-ama-cyan/15 align-top",
    sessions.length === 0 && "h-8",
  );

  if (sessions.length === 0) {
    if (!canCreate) {
      return <td className={cellClassName} />;
    }

    return (
      <td className={cellClassName}>
        <button
          type="button"
          className="flex h-8 w-full items-center text-left transition hover:bg-ama-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ama-blue/40"
          onClick={handleCreate}
          aria-label={`Agendar sessão ${formatWeekdayShort(date)} às ${timeKey}`}
          title={`Agendar às ${timeKey}`}
        />
      </td>
    );
  }

  return (
    <td className={cn(cellClassName, "p-1")}>
      {canCreate ? (
        <button
          type="button"
          className="absolute inset-0 z-0 transition hover:bg-ama-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ama-blue/40"
          onClick={handleCreate}
          aria-label={`Agendar sessão ${formatWeekdayShort(date)} às ${timeKey}`}
          title={`Agendar às ${timeKey}`}
        />
      ) : null}
      <div className="relative z-10 grid grid-cols-2 gap-1">
        {sessions.map((session) => (
          <AgendaWeekSlotChip
            key={session._id}
            session={session}
            onOpenSession={onOpenSession}
          />
        ))}
      </div>
    </td>
  );
}

function isFullHourSlot(timeKey) {
  return timeKey.endsWith(":00");
}

export function AgendaWeekSlotView({
  referenceDate,
  grouped,
  onOpenDay,
  onOpenSession,
  onOpenCreate,
  isAdmin,
}) {
  const days = buildWeekDays(referenceDate);
  const timeSlots = buildWeekTimeSlotKeys(grouped, days);

  return (
    <CardContent className="space-y-3 p-4 sm:p-6">
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-ama-cyan/20 bg-white">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <thead className="sticky top-0 z-30 bg-white">
            <tr className="border-b border-ama-cyan/20">
              <th
                scope="col"
                className="sticky left-0 z-40 w-16 shrink-0 border-r border-ama-cyan/15 bg-white px-2 py-2 text-center text-[11px] font-semibold uppercase text-ama-blue-dark sm:text-xs"
              >
                Horário
              </th>
              {days.map((date) => (
                <th key={toCalendarKey(date)} scope="col" className="bg-white p-0 font-normal">
                  <WeekDayHeader date={date} onOpenDay={onOpenDay} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeKey) => (
              <tr
                key={timeKey}
                className={cn(
                  "border-b border-ama-cyan/10 last:border-b-0",
                  isFullHourSlot(timeKey) && "border-t border-t-ama-cyan/20",
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-20 w-16 border-r border-ama-cyan/15 bg-white px-2 py-1 text-center text-xs font-semibold tabular-nums text-ama-blue-dark sm:text-sm"
                >
                  {formatTimeSlotLabel(timeKey)}
                </th>
                {days.map((date) => (
                  <WeekSlotCell
                    key={`${toCalendarKey(date)}-${timeKey}`}
                    date={date}
                    timeKey={timeKey}
                    sessions={getSessionsAtTimeSlot(grouped, date, timeKey)}
                    onOpenSession={onOpenSession}
                    onOpenCreate={onOpenCreate}
                    isAdmin={isAdmin}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Grade completa das {formatHourLabel(OCCUPANCY_START_HOUR)} às{" "}
        {formatHourLabel(OCCUPANCY_END_HOUR)} (intervalos de 15 min). Clique em uma sessão para
        ver detalhes.
        {isAdmin
          ? " Clique em um horário vazio (ou no espaço livre de um horário) para agendar — a data e o início serão preenchidos automaticamente."
          : null}
      </p>
    </CardContent>
  );
}
