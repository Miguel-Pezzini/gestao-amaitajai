import { formatDayNumber, isToday } from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

export function CalendarDayNumber({ date, muted = false, className }) {
  const today = isToday(date);

  return (
    <p
      className={cn(
        "shrink-0 text-[11px] font-semibold leading-none sm:text-sm",
        today
          ? "flex size-6 items-center justify-center rounded-full bg-ama-blue text-white sm:size-7"
          : muted
            ? "text-muted-foreground/70"
            : "text-ama-blue-dark",
        className,
      )}
      aria-current={today ? "date" : undefined}
    >
      {formatDayNumber(date)}
    </p>
  );
}
