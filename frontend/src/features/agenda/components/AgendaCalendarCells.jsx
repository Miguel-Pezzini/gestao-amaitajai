import { CalendarMonthDaySummary } from "@/features/agenda/components/CalendarMonthDaySummary";
import { CalendarDayNumber } from "@/features/agenda/components/CalendarDayNumber";
import {
  formatMonthDaySummaryLabel,
  formatWeekdayShort,
  isToday,
  summarizeDaySessions,
} from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

export function WeekdayCell({ date, items, onOpenDay, tall = false }) {
  const today = isToday(date);
  const summary = summarizeDaySessions(items, date);
  const dayLabel = formatMonthDaySummaryLabel(summary);

  return (
    <button
      type="button"
      onClick={() => onOpenDay(date)}
      aria-label={`${formatWeekdayShort(date)} ${date.getDate()}, ${dayLabel}. Abrir dia`}
      className={cn(
        "flex flex-col gap-0.5 rounded-md border bg-white p-1 text-left transition hover:border-ama-cyan hover:bg-ama-light/40 sm:gap-1 sm:p-1.5 lg:p-2",
        tall ? "min-h-40 sm:min-h-52 lg:min-h-64" : "min-h-16 sm:min-h-24 lg:min-h-32",
        today
          ? "border-ama-blue ring-1 ring-ama-blue/30"
          : summary.hasPending
            ? "border-amber-400/80 ring-1 ring-amber-400/25"
            : summary.isDayFinished
              ? "border-ama-blue/70 ring-1 ring-ama-blue/20"
              : "border-ama-cyan/25",
      )}
    >
      <CalendarDayNumber date={date} />
      <CalendarMonthDaySummary sessions={items} date={date} />
    </button>
  );
}

export function WeekendCell({ date, tall = false }) {
  const today = isToday(date);

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-dashed bg-muted/30 p-1 sm:p-1.5 lg:p-2",
        tall ? "min-h-40 sm:min-h-52 lg:min-h-64" : "min-h-16 sm:min-h-24 lg:min-h-32",
        today ? "border-ama-blue/50 ring-1 ring-ama-blue/20" : "border-muted-foreground/20",
      )}
      aria-hidden
    >
      <CalendarDayNumber date={date} muted />
    </div>
  );
}

export function EmptyLeadingCell({ tall = false }) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-transparent",
        tall ? "min-h-40 sm:min-h-52 lg:min-h-64" : "min-h-16 sm:min-h-24 lg:min-h-32",
      )}
    />
  );
}

export function WeekColumnHeader({ date }) {
  const today = isToday(date);
  const weekday = formatWeekdayShort(date);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md py-1",
        today && "bg-ama-light/60",
      )}
    >
      <span
        className={cn(
          "text-[11px] font-semibold uppercase sm:text-xs",
          today ? "text-ama-blue" : "text-ama-blue-dark",
        )}
      >
        <span className="sm:hidden">{weekday.charAt(0)}</span>
        <span className="hidden sm:inline">{weekday}</span>
      </span>
      <CalendarDayNumber date={date} />
    </div>
  );
}
