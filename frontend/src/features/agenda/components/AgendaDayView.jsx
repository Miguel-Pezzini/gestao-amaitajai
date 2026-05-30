import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { AgendaTimeGrid } from "@/features/agenda/components/AgendaTimeGrid";
import { CalendarDayNumber } from "@/features/agenda/components/CalendarDayNumber";
import { formatWeekdayShort, isToday } from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

export function AgendaDayView({
  referenceDate,
  sessions,
  isAdmin,
  onOpenSession,
  onOpenSessionGroup,
  onOpenCreate,
}) {
  const today = isToday(referenceDate);

  return (
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
          today ? "border-ama-blue/40 bg-ama-light/50" : "border-ama-cyan/25 bg-white",
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarDayNumber date={referenceDate} className="!size-9 !text-base sm:!size-10" />
          <div>
            <p className="text-sm font-semibold capitalize text-ama-blue-dark">
              {formatWeekdayShort(referenceDate)}
            </p>
            {today ? (
              <p className="text-xs font-medium text-ama-blue">Hoje</p>
            ) : null}
          </div>
        </div>

        {isAdmin ? (
          <Button
            type="button"
            size="sm"
            className="bg-ama-blue text-white hover:bg-ama-blue-dark"
            onClick={() => onOpenCreate(referenceDate)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova sessão
          </Button>
        ) : null}
      </div>

      <AgendaTimeGrid
        days={[referenceDate]}
        getDaySessions={() => sessions}
        onOpenSession={onOpenSession}
        onOpenSessionGroup={onOpenSessionGroup}
        onOpenCreate={isAdmin ? onOpenCreate : undefined}
        overlapLayout="sideBySide"
        showCaption
      />

      {sessions.length === 0 ? (
        isAdmin ? (
          <div className="rounded-lg border border-dashed border-ama-cyan/30 bg-ama-light/30 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 border-ama-cyan/40"
              onClick={() => onOpenCreate(referenceDate)}
            >
              <Plus className="size-4" aria-hidden="true" />
              Agendar sessão
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
        )
      ) : null}
    </CardContent>
  );
}
