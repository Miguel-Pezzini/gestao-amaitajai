import { Button } from "@/components/ui/button";
import { AGENDA_VIEW_MODE_OPTIONS } from "@/features/agenda/constants";
import { cn } from "@/lib/utils";

export function AgendaViewModeToggle({ viewMode, onViewModeChange }) {
  return (
    <div
      className="flex w-full rounded-md border border-ama-cyan/30 bg-white p-0.5 sm:inline-flex sm:w-auto"
      role="group"
      aria-label="Modo de visualização da agenda"
    >
      {AGENDA_VIEW_MODE_OPTIONS.map((option) => {
        const active = viewMode === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={active ? "default" : "ghost"}
            className={cn(
              "h-9 flex-1 px-2 text-xs sm:h-8 sm:flex-none sm:px-4",
              active && "bg-ama-blue text-white hover:bg-ama-blue-dark",
            )}
            aria-pressed={active}
            onClick={() => onViewModeChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
