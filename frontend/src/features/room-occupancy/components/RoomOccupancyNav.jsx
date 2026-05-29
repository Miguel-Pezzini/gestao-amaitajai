import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isCurrentWorkWeek,
  navigateWorkWeek,
  workWeekRangeLabel,
} from "@/features/room-occupancy/utils";
import { cn } from "@/lib/utils";

export function RoomOccupancyNav({
  referenceDate,
  rooms,
  selectedRoomId,
  onRoomChange,
  onReferenceDateChange,
}) {
  const label = workWeekRangeLabel(referenceDate);
  const showGoToToday = !isCurrentWorkWeek(referenceDate);

  function handleNavigate(direction) {
    onReferenceDateChange(navigateWorkWeek(referenceDate, direction));
  }

  function handleGoToToday() {
    onReferenceDateChange(new Date());
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div
        className="flex w-full flex-wrap gap-1 rounded-md border border-ama-cyan/30 bg-white p-0.5"
        role="group"
        aria-label="Selecionar sala"
      >
        {rooms.map((room) => {
          const active = room._id === selectedRoomId;
          return (
            <Button
              key={room._id}
              type="button"
              size="sm"
              variant={active ? "default" : "ghost"}
              className={cn(
                "h-9 flex-1 px-2 text-xs sm:h-8 sm:flex-none sm:px-4",
                active && "bg-ama-blue text-white hover:bg-ama-blue-dark",
              )}
              aria-pressed={active}
              onClick={() => onRoomChange(room._id)}
            >
              {room.name}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {showGoToToday ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 self-start border-ama-cyan/40 text-ama-blue-dark sm:order-first sm:mr-auto sm:self-auto"
            onClick={handleGoToToday}
          >
            Hoje
          </Button>
        ) : null}

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="size-9 shrink-0 px-0 sm:size-8"
            onClick={() => handleNavigate("prev")}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p
            className="min-w-0 flex-1 truncate px-1 text-center text-sm font-medium capitalize sm:min-w-[16rem] sm:text-base"
            title={label}
          >
            {label}
          </p>
          <Button
            type="button"
            variant="outline"
            className="size-9 shrink-0 px-0 sm:size-8"
            onClick={() => handleNavigate("next")}
            aria-label="Próxima semana"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
