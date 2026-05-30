import { AGENDA_TIME_GRID_HEIGHT_PX, AGENDA_TIME_GRID_HOUR_COLUMN_REM } from "@/features/agenda/constants";
import { buildTimeAxisLabels } from "@/features/room-occupancy/utils";
import { cn } from "@/lib/utils";

export function TimeGridAxisLabels() {
  const labels = buildTimeAxisLabels();

  return (
    <div
      className="relative shrink-0 border-r border-ama-cyan/15 pr-1"
      style={{
        height: `${AGENDA_TIME_GRID_HEIGHT_PX}px`,
        width: `${AGENDA_TIME_GRID_HOUR_COLUMN_REM}rem`,
      }}
      aria-hidden="true"
    >
      {labels.map((item) => (
        <span
          key={item.label}
          className={cn(
            "absolute right-1 -translate-y-1/2 tabular-nums text-muted-foreground",
            item.isHour
              ? "text-[10px] font-semibold sm:text-xs"
              : "text-[9px] opacity-80 sm:text-[10px]",
          )}
          style={{ top: `${item.topPercent}%` }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
