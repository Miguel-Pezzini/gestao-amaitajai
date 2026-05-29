import { CardContent } from "@/components/ui/card";
import {
  EmptyLeadingCell,
  WeekdayCell,
  WeekendCell,
} from "@/features/agenda/components/AgendaCalendarCells";
import { buildMonthGrid, isWeekend, toCalendarKey, WEEKDAY_HEADERS } from "@/features/agenda/utils";

export function AgendaMonthView({ referenceDate, grouped, onOpenDay }) {
  const { days, emptyCells } = buildMonthGrid(referenceDate);

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 px-1.5 text-center text-[11px] font-semibold uppercase sm:gap-1 sm:px-4 sm:text-xs">
        {WEEKDAY_HEADERS.map((label, index) => (
          <span
            key={label}
            className={
              index === 0 || index === 6
                ? "text-muted-foreground/50"
                : "text-ama-blue-dark"
            }
          >
            <span className="sm:hidden">{label.charAt(0)}</span>
            <span className="hidden sm:inline">{label}</span>
          </span>
        ))}
      </div>

      <CardContent className="grid grid-cols-7 gap-0.5 p-1.5 sm:gap-1 sm:p-4">
        {emptyCells.map((key) => (
          <EmptyLeadingCell key={key} />
        ))}
        {days.map((date) => {
          const key = toCalendarKey(date);
          if (isWeekend(date)) {
            return <WeekendCell key={key} date={date} />;
          }
          const items = grouped[key] ?? [];
          return (
            <WeekdayCell
              key={key}
              date={date}
              items={items}
              onOpenDay={onOpenDay}
            />
          );
        })}
      </CardContent>
    </>
  );
}
