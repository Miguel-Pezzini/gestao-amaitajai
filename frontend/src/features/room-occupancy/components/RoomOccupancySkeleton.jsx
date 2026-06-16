import { CardContent } from "@/components/ui/card";
import { SkeletonBar } from "@/components/ui/list-skeleton";
import {
  AGENDA_TIME_GRID_HEIGHT_PX,
  AGENDA_TIME_GRID_HOUR_COLUMN_REM,
} from "@/features/agenda/constants";
import { cn } from "@/lib/utils";

const WORK_WEEK_COLUMN_COUNT = 5;

const TIME_GRID_BLOCK_PLACEHOLDERS = [
  { top: "8%", height: "14%" },
  { top: "22%", height: "10%" },
  { top: "38%", height: "16%" },
  { top: "55%", height: "12%" },
  { top: "72%", height: "18%" },
];

function RoomOccupancyNavSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex gap-1 rounded-md border border-ama-cyan/30 bg-white p-0.5">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonBar key={index} className="h-9 flex-1 rounded-md sm:h-8" />
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <SkeletonBar className="size-8 rounded-md sm:order-first sm:mr-auto" />
        <SkeletonBar className="size-8 rounded-md" />
        <SkeletonBar className="h-4 w-36 max-w-[50%] flex-1 sm:w-48" />
        <SkeletonBar className="size-8 rounded-md" />
      </div>
    </div>
  );
}

function OccupancyDayColumnSkeleton({ columnIndex }) {
  const blocks = TIME_GRID_BLOCK_PLACEHOLDERS.filter(
    (_, blockIndex) => (columnIndex + blockIndex) % 3 !== 0,
  );

  return (
    <div
      className="relative min-w-[7.5rem] flex-1 border-l border-ama-cyan/15 bg-ama-light/20"
      style={{ height: `${AGENDA_TIME_GRID_HEIGHT_PX}px` }}
    >
      {blocks.map((block, index) => (
        <SkeletonBar
          key={index}
          className="absolute inset-x-1 rounded-md"
          style={{ top: block.top, height: block.height }}
        />
      ))}
    </div>
  );
}

function RoomOccupancyGridSkeleton() {
  const gridTemplate = `${AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem 1fr`;

  return (
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div className="overflow-x-auto rounded-lg border border-ama-cyan/20 bg-white">
        <div className="min-w-[44rem]">
          <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
            <div aria-hidden="true" />
            <div className="grid grid-cols-5">
              {Array.from({ length: WORK_WEEK_COLUMN_COUNT }, (_, index) => (
                <div
                  key={index}
                  className="border-b border-ama-cyan/20 px-2 py-2 text-center"
                >
                  <SkeletonBar className="mx-auto h-3 w-12" />
                  <SkeletonBar className="mx-auto mt-1.5 h-4 w-10" />
                </div>
              ))}
            </div>
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

            <div className="grid grid-cols-5">
              {Array.from({ length: WORK_WEEK_COLUMN_COUNT }, (_, index) => (
                <OccupancyDayColumnSkeleton key={index} columnIndex={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-ama-cyan/15 bg-ama-light/30 px-4 py-3">
        <SkeletonBar className="h-3 w-28" />
        <div className="space-y-2">
          {Array.from({ length: WORK_WEEK_COLUMN_COUNT }, (_, index) => (
            <SkeletonBar
              key={index}
              className={cn("h-3", index % 2 === 0 ? "w-full max-w-lg" : "w-4/5 max-w-md")}
            />
          ))}
        </div>
      </div>

      <SkeletonBar className="h-3 w-full max-w-2xl" />
    </CardContent>
  );
}

function RoomOccupancySkeleton({ showNav = false }) {
  return (
    <div aria-busy="true" aria-label="Carregando ocupação das salas">
      {showNav ? (
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
          <RoomOccupancyNavSkeleton />
        </div>
      ) : null}
      <RoomOccupancyGridSkeleton />
    </div>
  );
}

export { RoomOccupancyGridSkeleton, RoomOccupancyNavSkeleton, RoomOccupancySkeleton };
