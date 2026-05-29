import { CardContent } from "@/components/ui/card";
import {
  WeekColumnHeader,
  WeekdayCell,
  WeekendCell,
} from "@/features/agenda/components/AgendaCalendarCells";
import { buildWeekDays, isWeekend, toCalendarKey } from "@/features/agenda/utils";

export function AgendaWeekView({ referenceDate, grouped, onOpenDay }) {
  const days = buildWeekDays(referenceDate);

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 px-1.5 sm:gap-1 sm:px-4">
        {days.map((date) => (
          <WeekColumnHeader key={toCalendarKey(date)} date={date} />
        ))}
      </div>

      <CardContent className="grid grid-cols-7 gap-0.5 p-1.5 sm:gap-1 sm:p-4">
        {days.map((date) => {
          const key = toCalendarKey(date);
          if (isWeekend(date)) {
            return <WeekendCell key={key} date={date} tall />;
          }
          const items = grouped[key] ?? [];
          return (
            <WeekdayCell
              key={key}
              date={date}
              items={items}
              onOpenDay={onOpenDay}
              tall
            />
          );
        })}
      </CardContent>
    </>
  );
}
