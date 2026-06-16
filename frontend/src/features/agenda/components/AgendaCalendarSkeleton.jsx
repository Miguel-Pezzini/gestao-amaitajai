import { CardContent } from "@/components/ui/card";
import { SkeletonBar } from "@/components/ui/list-skeleton";
import {
  AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM,
  AGENDA_TIME_GRID_HEIGHT_PX,
  AGENDA_TIME_GRID_HOUR_COLUMN_REM,
  AGENDA_VIEW_MODES,
} from "@/features/agenda/constants";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Blocos fictícios em % do topo e altura para variar o visual da grade. */
const TIME_GRID_BLOCK_PLACEHOLDERS = [
  { top: "8%", height: "14%" },
  { top: "22%", height: "10%" },
  { top: "38%", height: "16%" },
  { top: "55%", height: "12%" },
  { top: "72%", height: "18%" },
];

function MonthDayCellSkeleton({ muted = false }) {
  return (
    <div
      className={cn(
        "flex min-h-16 flex-col gap-1.5 rounded-md border p-1.5 sm:min-h-24 sm:gap-2 sm:p-2 lg:min-h-32",
        muted
          ? "border-dashed border-muted-foreground/15 bg-muted/20"
          : "border-ama-cyan/20 bg-white",
      )}
    >
      <SkeletonBar className={cn("size-6 rounded-full sm:size-7", muted && "opacity-60")} />
      {!muted ? (
        <>
          <SkeletonBar className="h-2.5 w-3/4" />
          <SkeletonBar className="hidden h-2 w-1/2 sm:block" />
        </>
      ) : null}
    </div>
  );
}

function AgendaMonthSkeleton() {
  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 px-1.5 text-center sm:gap-1 sm:px-4">
        {WEEKDAY_LABELS.map((label, index) => (
          <SkeletonBar
            key={`${label}-${index}`}
            className="mx-auto h-3 w-6 sm:h-3.5 sm:w-10"
          />
        ))}
      </div>

      <CardContent className="grid grid-cols-7 gap-0.5 p-1.5 sm:gap-1 sm:p-4">
        {Array.from({ length: 3 }, (_, index) => (
          <MonthDayCellSkeleton key={`leading-${index}`} muted />
        ))}
        {Array.from({ length: 28 }, (_, index) => (
          <MonthDayCellSkeleton key={`day-${index}`} />
        ))}
        {Array.from({ length: 4 }, (_, index) => (
          <MonthDayCellSkeleton key={`trailing-${index}`} muted />
        ))}
      </CardContent>
    </>
  );
}

function TimeGridDayColumnSkeleton({ blocks, compact }) {
  return (
    <div
      className="relative border-l border-ama-cyan/15 bg-ama-light/20"
      style={{ height: `${AGENDA_TIME_GRID_HEIGHT_PX}px` }}
    >
      {blocks.map((block, index) => (
        <SkeletonBar
          key={index}
          className={cn(
            "absolute inset-x-1 rounded-md",
            compact ? "inset-x-0.5" : "inset-x-1",
          )}
          style={{ top: block.top, height: block.height }}
        />
      ))}
    </div>
  );
}

function AgendaTimeGridSkeleton({ columnCount }) {
  const gridTemplate = `${AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem repeat(${columnCount}, minmax(${AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM}rem, 1fr))`;
  const compact = columnCount > 1;

  return (
    <div className="overflow-x-auto rounded-lg border border-ama-cyan/20 bg-white">
      <div
        style={{
          minWidth: `${columnCount * AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM + AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem`,
        }}
      >
        <div
          className="grid border-b border-ama-cyan/20"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div aria-hidden="true" />
          {Array.from({ length: columnCount }, (_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1 border-b border-ama-cyan/20 px-1 py-2"
            >
              <SkeletonBar className="h-3 w-10" />
              <SkeletonBar className="h-4 w-6" />
            </div>
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
          <div
            className="relative shrink-0 border-r border-ama-cyan/15 pr-1"
            style={{
              height: `${AGENDA_TIME_GRID_HEIGHT_PX}px`,
              width: `${AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem`,
            }}
            aria-hidden="true"
          >
            {["8h", "10h", "12h", "14h", "16h", "18h"].map((label, index) => (
              <SkeletonBar
                key={label}
                className="absolute right-1 h-2.5 w-8"
                style={{ top: `${8 + index * 16}%` }}
              />
            ))}
          </div>

          {Array.from({ length: columnCount }, (_, columnIndex) => (
            <TimeGridDayColumnSkeleton
              key={columnIndex}
              compact={compact}
              blocks={TIME_GRID_BLOCK_PLACEHOLDERS.filter(
                (_, blockIndex) => (columnIndex + blockIndex) % 3 !== 0,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgendaWeekSkeleton() {
  return (
    <CardContent className="space-y-3 p-4 sm:p-6">
      <AgendaTimeGridSkeleton columnCount={7} />
      <SkeletonBar className="h-3 w-full max-w-md" />
    </CardContent>
  );
}

function AgendaDaySkeleton() {
  return (
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-ama-cyan/25 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <SkeletonBar className="size-9 rounded-full sm:size-10" />
          <div className="space-y-2">
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-3 w-12" />
          </div>
        </div>
        <SkeletonBar className="h-8 w-28 rounded-md" />
      </div>

      <AgendaTimeGridSkeleton columnCount={1} />
      <SkeletonBar className="h-3 w-full max-w-lg" />
    </CardContent>
  );
}

function AgendaCalendarSkeleton({ viewMode }) {
  return (
    <div aria-busy="true" aria-label="Carregando agenda">
      {viewMode === AGENDA_VIEW_MODES.MONTH ? <AgendaMonthSkeleton /> : null}
      {viewMode === AGENDA_VIEW_MODES.WEEK ? <AgendaWeekSkeleton /> : null}
      {viewMode === AGENDA_VIEW_MODES.DAY ? <AgendaDaySkeleton /> : null}
    </div>
  );
}

export { AgendaCalendarSkeleton };
