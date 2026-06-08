import { summarizeDaySessions, formatMonthDaySummaryLabel } from "@/features/agenda/utils";
import { cn } from "@/lib/utils";

const STATUS_ITEMS = [
  {
    key: "agendada",
    dotClass: "bg-amber-500",
    countClass: "text-amber-700",
  },
  {
    key: "realizada",
    dotClass: "bg-sky-600",
    countClass: "text-sky-700",
  },
  {
    key: "cancelada",
    dotClass: "bg-red-500",
    countClass: "text-red-600",
  },
];

export function CalendarMonthDaySummary({ sessions, date }) {
  const summary = summarizeDaySessions(sessions, date);

  if (summary.total === 0) {
    return null;
  }

  return (
    <div
      className="mt-0.5 flex min-h-0 flex-1 flex-col items-center justify-center gap-1 sm:gap-1.5"
      title={formatMonthDaySummaryLabel(summary)}
    >
      <p className="text-lg font-bold leading-none text-ama-blue-dark sm:text-2xl">
        {summary.total}
      </p>
      <p className="text-[9px] font-medium leading-none text-muted-foreground sm:text-[10px]">
        {summary.total === 1 ? "sessão" : "sessões"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 sm:gap-x-2.5">
        {STATUS_ITEMS.map(({ key, dotClass, countClass }) => {
          const count = summary[key];
          if (count === 0) {
            return null;
          }

          return (
            <span
              key={key}
              className={cn("inline-flex items-center gap-0.5 text-[9px] font-semibold sm:text-[10px]", countClass)}
            >
              <span className={cn("size-1.5 shrink-0 rounded-full sm:size-2", dotClass)} aria-hidden />
              {count}
            </span>
          );
        })}
      </div>

      {summary.hasPending ? (
        <p className="max-w-full truncate px-0.5 text-center text-[8px] font-semibold leading-tight text-amber-700 sm:text-[9px]">
          Pendências
        </p>
      ) : null}
    </div>
  );
}
