import { CardContent } from "@/components/ui/card";
import { AgendaTimeGrid } from "@/features/agenda/components/AgendaTimeGrid";
import { buildWeekDays, toCalendarKey } from "@/features/agenda/utils";

export function AgendaWeekView({
  referenceDate,
  grouped,
  onOpenDay,
  onOpenSession,
  onOpenSessionGroup,
}) {
  const days = buildWeekDays(referenceDate);

  function getDaySessions(date) {
    return grouped[toCalendarKey(date)] ?? [];
  }

  return (
    <CardContent className="space-y-3 p-4 sm:p-6">
      <AgendaTimeGrid
        days={days}
        getDaySessions={getDaySessions}
        onOpenSession={onOpenSession}
        onOpenSessionGroup={onOpenSessionGroup}
        onOpenDay={onOpenDay}
      />
    </CardContent>
  );
}
