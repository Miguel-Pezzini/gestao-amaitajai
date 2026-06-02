import { CardContent } from "@/components/ui/card";
import { TimeGridAxisLabels } from "@/features/agenda/components/TimeGridAxisLabels";
import { TimeGridSlotLines } from "@/features/agenda/components/TimeGridSlotLines";
import { RoomOccupancyBlock } from "@/features/room-occupancy/components/RoomOccupancyBlock";
import { RoomOccupancySessionGroup } from "@/features/room-occupancy/components/RoomOccupancySessionGroup";
import {
  AGENDA_TIME_GRID_HEIGHT_PX,
  AGENDA_TIME_GRID_HOUR_COLUMN_REM,
} from "@/features/agenda/constants";
import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_SLOT_MINUTES,
  OCCUPANCY_START_HOUR,
} from "@/features/room-occupancy/constants";
import {
  computeDayFreeGaps,
  formatHourLabel,
  prepareOccupancyGridBlocks,
} from "@/features/room-occupancy/utils";
import { formatWeekdayLong, isToday, toCalendarKey } from "@/features/agenda/utils";
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
        {formatWeekdayLong(date)}
      </p>
      <p className={cn("text-sm font-semibold capitalize", today && "text-ama-blue")}>
        {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)}
      </p>
    </div>
  );
}

function DayColumn({ date, sessions, onOpenSession }) {
  const today = isToday(date);
  const blocks = prepareOccupancyGridBlocks(sessions);

  return (
    <div
      className={cn(
        "relative min-w-[7.5rem] flex-1 border-l border-ama-cyan/15",
        today && "bg-ama-light/20",
      )}
    >
      <div
        className="relative"
        style={{ height: `${AGENDA_TIME_GRID_HEIGHT_PX}px` }}
        aria-label={`Ocupação ${formatWeekdayLong(date)}`}
      >
        <TimeGridSlotLines />

        {blocks.map((block) =>
          block.type === "group" ? (
            <RoomOccupancySessionGroup
              key={block.id}
              block={block}
              onOpenSession={onOpenSession}
            />
          ) : (
            <RoomOccupancyBlock
              key={block.session._id}
              session={block.session}
              onOpenSession={onOpenSession}
            />
          ),
        )}
      </div>
    </div>
  );
}

function DaySummary({ date, sessions }) {
  const gaps = computeDayFreeGaps(sessions);
  const weekday = formatWeekdayLong(date);

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
  const gridTemplate = `${AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem 1fr`;

  return (
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div className="overflow-x-auto rounded-lg border border-ama-cyan/20 bg-white">
        <div className="min-w-[44rem]">
          <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
            <div aria-hidden="true" />
            <div className="grid grid-cols-5">
              {workWeekDays.map((date) => (
                <DayColumnHeader key={toCalendarKey(date)} date={date} />
              ))}
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
            <TimeGridAxisLabels />

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
        Grade das {formatHourLabel(OCCUPANCY_START_HOUR)} às {formatHourLabel(OCCUPANCY_END_HOUR)}{" "}
        (intervalos de {OCCUPANCY_SLOT_MINUTES} min). Horários sobrepostos na mesma sala aparecem
        agrupados — clique para ver todos.
      </p>
    </CardContent>
  );
}
