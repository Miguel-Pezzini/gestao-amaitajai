import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaViewModeToggle } from "@/features/agenda/components/AgendaViewModeToggle";
import { referenceDateLabel } from "@/features/agenda/utils";

export function AgendaCalendarNav({
  referenceDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onGoToToday,
}) {
  const label = referenceDateLabel(referenceDate, viewMode);

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AgendaViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-ama-cyan/40 text-ama-blue-dark"
            onClick={onGoToToday}
          >
            Hoje
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => onNavigate("prev")}
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="min-w-[10rem] flex-1 text-center text-sm font-medium capitalize sm:min-w-[14rem] sm:text-base">
            {label}
          </p>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => onNavigate("next")}
            aria-label="Próximo período"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
