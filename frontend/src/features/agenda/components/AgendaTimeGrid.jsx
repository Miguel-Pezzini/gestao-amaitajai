import {
  AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM,
  AGENDA_TIME_GRID_HEIGHT_PX,
  AGENDA_TIME_GRID_HOUR_COLUMN_REM,
  DEFAULT_SESSION_START_TIME,
} from "@/features/agenda/constants";
import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_SLOT_MINUTES,
  OCCUPANCY_START_HOUR,
} from "@/features/room-occupancy/constants";
import { formatHourLabel } from "@/features/room-occupancy/utils";
import { AgendaTimeGridSession } from "@/features/agenda/components/AgendaTimeGridSession";
import { TimeGridAxisLabels } from "@/features/agenda/components/TimeGridAxisLabels";
import { TimeGridSessionGroup } from "@/features/agenda/components/TimeGridSessionGroup";
import { TimeGridSlotLines } from "@/features/agenda/components/TimeGridSlotLines";
import {
  getTimeKeyFromGridClick,
  TIME_GRID_SESSION_ATTR,
} from "@/features/agenda/utils/timeGridClick";
import {
  prepareAgendaDaySideBySideBlocks,
  prepareAgendaTimeGridBlocks,
} from "@/features/agenda/utils/timeGridLayout";
import { formatWeekdayLong, isToday, isWeekend, toCalendarKey } from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

function TimeGridDayHeader({ date, onOpenDay }) {
  const today = isToday(date);
  const weekend = isWeekend(date);
  const weekday = formatWeekdayLong(date);

  const content = (
    <>
      <span
        className={cn(
          "text-[11px] font-semibold capitalize sm:text-xs",
          weekend ? "text-muted-foreground/50" : today ? "text-ama-blue" : "text-ama-blue-dark",
        )}
      >
        {weekday}
      </span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          weekend ? "text-muted-foreground/50" : today ? "text-ama-blue" : "text-ama-blue-dark",
        )}
      >
        {new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(date)}
      </span>
    </>
  );

  if (weekend || !onOpenDay) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-0.5 border-b border-ama-cyan/20 px-1 py-2",
          weekend && "border-dashed bg-muted/20",
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
        "flex w-full flex-col items-center gap-0.5 border-b border-ama-cyan/20 px-1 py-2 transition hover:bg-ama-light/40",
        today && "bg-ama-light/60",
      )}
    >
      {content}
    </button>
  );
}

function TimeGridDayColumn({
  date,
  sessions,
  onOpenSession,
  onOpenSessionGroup,
  onOpenDay,
  onOpenCreate,
  compact,
  overlapLayout,
}) {
  const today = isToday(date);
  const weekend = isWeekend(date);
  const canCreateOnGrid = onOpenCreate && !weekend;
  const canOpenDayOnGrid = onOpenDay && !weekend && !canCreateOnGrid;

  const blocks = weekend
    ? []
    : overlapLayout === "sideBySide"
      ? prepareAgendaDaySideBySideBlocks(sessions)
      : prepareAgendaTimeGridBlocks(sessions);

  function handleGridClick(event) {
    if (event.target.closest(`[${TIME_GRID_SESSION_ATTR}]`)) {
      return;
    }

    if (canCreateOnGrid) {
      const timeKey = getTimeKeyFromGridClick(event.clientY, event.currentTarget);
      onOpenCreate(date, timeKey);
      return;
    }

    if (canOpenDayOnGrid) {
      onOpenDay(date);
    }
  }

  function handleGridKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    if (event.target.closest(`[${TIME_GRID_SESSION_ATTR}]`)) {
      return;
    }
    event.preventDefault();

    if (canCreateOnGrid) {
      onOpenCreate(date, DEFAULT_SESSION_START_TIME);
      return;
    }

    if (canOpenDayOnGrid) {
      onOpenDay(date);
    }
  }

  const gridInteractive = canCreateOnGrid || canOpenDayOnGrid;

  return (
    <div
      className={cn(
        "relative min-w-0 flex-1 border-l border-ama-cyan/15",
        weekend && "border-dashed bg-muted/20",
        today && !weekend && "bg-ama-light/20",
      )}
    >
      <div
        role={gridInteractive ? "button" : undefined}
        tabIndex={gridInteractive ? 0 : undefined}
        onClick={gridInteractive ? handleGridClick : undefined}
        onKeyDown={gridInteractive ? handleGridKeyDown : undefined}
        className={cn("relative", gridInteractive && "cursor-pointer")}
        style={{ height: `${AGENDA_TIME_GRID_HEIGHT_PX}px` }}
        aria-label={
          weekend
            ? undefined
            : canCreateOnGrid
              ? `Agendar em ${formatWeekdayLong(date)}. Clique em um horário vazio.`
              : `Sessões de ${formatWeekdayLong(date)}. Clique para ver o dia.`
        }
      >
        <TimeGridSlotLines />

        {blocks.map((block) =>
          block.type === "group" ? (
            <TimeGridSessionGroup
              key={block.id}
              block={block}
              onOpenGroup={(groupBlock) => onOpenSessionGroup(groupBlock, date)}
              compact={compact}
            />
          ) : (
            <AgendaTimeGridSession
              key={block.session._id}
              session={block.session}
              onOpenSession={onOpenSession}
              compact={compact}
            />
          ),
        )}
      </div>
    </div>
  );
}

export function AgendaTimeGrid({
  days,
  getDaySessions,
  onOpenSession,
  onOpenSessionGroup,
  onOpenDay,
  onOpenCreate,
  showCaption = true,
  overlapLayout = "grouped",
}) {
  const columnCount = days.length;
  const gridTemplate = `${AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem repeat(${columnCount}, minmax(${AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM}rem, 1fr))`;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-ama-cyan/20 bg-white">
        <div
          style={{
            minWidth:
              columnCount > 1
                ? `${columnCount * AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM + AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem`
                : `${AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM + AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem`,
          }}
        >
          <div
            className="grid border-b border-ama-cyan/20"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div aria-hidden="true" />
            {days.map((date) => (
              <TimeGridDayHeader
                key={toCalendarKey(date)}
                date={date}
                onOpenDay={onOpenDay}
              />
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
            <TimeGridAxisLabels />
            {days.map((date) => (
              <TimeGridDayColumn
                key={toCalendarKey(date)}
                date={date}
                sessions={getDaySessions(date)}
                onOpenSession={onOpenSession}
                onOpenSessionGroup={onOpenSessionGroup}
                onOpenDay={onOpenDay}
                onOpenCreate={onOpenCreate}
                compact={columnCount > 1}
                overlapLayout={overlapLayout}
              />
            ))}
          </div>
        </div>
      </div>

      {showCaption ? (
        <p className="text-xs text-muted-foreground">
          Grade das {formatHourLabel(OCCUPANCY_START_HOUR)} às {formatHourLabel(OCCUPANCY_END_HOUR)}{" "}
          (intervalos de {OCCUPANCY_SLOT_MINUTES} min). A altura de cada bloco reflete a duração.
          {overlapLayout === "sideBySide"
            ? " Sessões simultâneas aparecem lado a lado."
            : " Atendimentos com horários sobrepostos aparecem agrupados — clique para ver todos."}
          {onOpenCreate
            ? " Clique em um horário vazio para agendar — a data e o início serão preenchidos."
            : onOpenDay
              ? " Clique em um horário vazio para abrir o dia."
              : null}
        </p>
      ) : null}
    </div>
  );
}
