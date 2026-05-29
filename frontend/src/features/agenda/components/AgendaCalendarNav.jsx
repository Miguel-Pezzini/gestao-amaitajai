import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaViewModeToggle } from "@/features/agenda/components/AgendaViewModeToggle";
import { referenceDateLabel, isCurrentAgendaPeriod } from "@/features/agenda/utils";

export function AgendaCalendarNav({
  referenceDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onGoToToday,
}) {
  const label = referenceDateLabel(referenceDate, viewMode);
  const showGoToToday = !isCurrentAgendaPeriod(referenceDate, viewMode);

  const goToTodayButton = showGoToToday ? (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="shrink-0 self-start border-ama-cyan/40 text-ama-blue-dark sm:self-auto"
      onClick={onGoToToday}
    >
      Hoje
    </Button>
  ) : null;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AgendaViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

        <div className="hidden items-center gap-2 sm:flex">
          {goToTodayButton}
          <Button
            type="button"
            variant="outline"
            className="size-8 shrink-0 px-0"
            onClick={() => onNavigate("prev")}
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="min-w-[14rem] text-center text-base font-medium capitalize">{label}</p>
          <Button
            type="button"
            variant="outline"
            className="size-8 shrink-0 px-0"
            onClick={() => onNavigate("next")}
            aria-label="Próximo período"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            className="size-9 shrink-0 px-0"
            onClick={() => onNavigate("prev")}
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p
            className="min-w-0 flex-1 truncate px-1 text-center text-sm font-medium capitalize"
            title={label}
          >
            {label}
          </p>
          <Button
            type="button"
            variant="outline"
            className="size-9 shrink-0 px-0"
            onClick={() => onNavigate("next")}
            aria-label="Próximo período"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {goToTodayButton}
      </div>
    </div>
  );
}
