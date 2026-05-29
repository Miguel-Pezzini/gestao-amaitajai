import { CardContent } from "@/components/ui/card";
import { RoomOccupancyBlock } from "@/features/room-occupancy/components/RoomOccupancyBlock";
import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_GRID_HEIGHT_PX,
  OCCUPANCY_START_HOUR,
} from "@/features/room-occupancy/constants";
import {
  buildHourLabels,
  computeDayFreeGaps,
  formatHourLabel,
  sessionToGridMetrics,
} from "@/features/room-occupancy/utils";
import { formatWeekdayShort, isToday, toCalendarKey } from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

function DayColumnHeader({ date }) {
  const today = isToday(date);

  return (
    <div
      className={cn(
        "border-b border-ama-cyan/20 px-2 py-2 text-center",
        today && "bg-ama-light/60",
      )}
    >
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {formatWeekdayShort(date)}
      </p>
      <p className={cn("text-sm font-semibold capitalize", today && "text-ama-blue")}>
        {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)}
      </p>
    </div>
  );
}

function DayColumn({ date, sessions, onOpenSession }) {
  const today = isToday(date);
  const positionedSessions = sessions
    .map((session) => {
      const metrics = sessionToGridMetrics(session);
      if (!metrics) {
        return null;
      }
      return {
        ...session,
        _gridTop: metrics.topPercent,
        _gridHeight: metrics.heightPercent,
      };
    })
    .filter(Boolean);

  return (
    <div
      className={cn(
        "relative min-w-[7.5rem] flex-1 border-l border-ama-cyan/15",
        today && "bg-ama-light/20",
      )}
    >
      <div
        className="relative"
        style={{ height: `${OCCUPANCY_GRID_HEIGHT_PX}px` }}
        aria-label={`Ocupação ${formatWeekdayShort(date)}`}
      >
        {Array.from({ length: OCCUPANCY_END_HOUR - OCCUPANCY_START_HOUR }, (_, index) => (
          <div
            key={index}
            className="pointer-events-none absolute inset-x-0 border-t border-ama-cyan/10"
            style={{ top: `${((index + 1) / (OCCUPANCY_END_HOUR - OCCUPANCY_START_HOUR)) * 100}%` }}
          />
        ))}

        {positionedSessions.map((session) => (
          <RoomOccupancyBlock
            key={session._id}
            session={session}
            onOpenSession={onOpenSession}
          />
        ))}
      </div>
    </div>
  );
}

function DaySummary({ date, sessions }) {
  const gaps = computeDayFreeGaps(sessions);
  const weekday = formatWeekdayShort(date);

  if (sessions.length === 0 && gaps.length === 1) {
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium capitalize text-ama-blue-dark">{weekday}:</span> sem atendimentos
        agendados.
      </p>
    );
  }

  if (gaps.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium capitalize text-ama-blue-dark">{weekday}:</span>{" "}
        {sessions.length} atendimento(s), sem intervalos livres entre 8h e 18h.
      </p>
    );
  }

  const gapLabels = gaps.map((gap) => `${gap.start}–${gap.end}`).join(", ");

  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-medium capitalize text-ama-blue-dark">{weekday}:</span>{" "}
      {sessions.length} atendimento(s). Livre: {gapLabels}.
    </p>
  );
}

export function RoomOccupancyGrid({ workWeekDays, getDaySessions, onOpenSession }) {
  const hourLabels = buildHourLabels();

  return (
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div className="overflow-x-auto rounded-lg border border-ama-cyan/20 bg-white">
        <div className="min-w-[44rem]">
          <div className="grid grid-cols-[3.5rem_1fr]">
            <div aria-hidden="true" />
            <div className="grid grid-cols-5">
              {workWeekDays.map((date) => (
                <DayColumnHeader key={toCalendarKey(date)} date={date} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[3.5rem_1fr]">
            <div
              className="relative border-r border-ama-cyan/15 pr-1"
              style={{ height: `${OCCUPANCY_GRID_HEIGHT_PX}px` }}
            >
              {hourLabels.map((hour, index) => (
                <span
                  key={hour}
                  className="absolute right-1 -translate-y-1/2 text-[10px] text-muted-foreground sm:text-xs"
                  style={{ top: `${(index / (hourLabels.length - 1)) * 100}%` }}
                >
                  {formatHourLabel(hour)}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-5">
              {workWeekDays.map((date) => (
                <DayColumn
                  key={toCalendarKey(date)}
                  date={date}
                  sessions={getDaySessions(date)}
                  onOpenSession={onOpenSession}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-ama-cyan/15 bg-ama-light/30 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Horários livres
        </p>
        <div className="space-y-1">
          {workWeekDays.map((date) => (
            <DaySummary
              key={toCalendarKey(date)}
              date={date}
              sessions={getDaySessions(date)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Grade das {formatHourLabel(OCCUPANCY_START_HOUR)} às {formatHourLabel(OCCUPANCY_END_HOUR)}.
        Clique em um atendimento para ver detalhes.
      </p>
    </CardContent>
  );
}
