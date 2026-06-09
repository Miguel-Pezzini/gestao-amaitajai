export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function getTimeMinutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function buildOccurrenceStartAt(dateOnly: Date, timeMinutes: number): Date {
  const occurrence = new Date(dateOnly);
  occurrence.setHours(Math.floor(timeMinutes / 60), timeMinutes % 60, 0, 0);
  return occurrence;
}

export function defaultSeriesEndsAt(startAt: Date): Date {
  const endsAt = new Date(startAt);
  endsAt.setMonth(11, 31);
  endsAt.setHours(0, 0, 0, 0);
  return endsAt;
}

export function toDateOnly(value: Date): Date {
  const dateOnly = new Date(value);
  dateOnly.setHours(0, 0, 0, 0);
  return dateOnly;
}

export function generateRecurrenceDates(params: {
  startAt: Date;
  weekdays: number[];
  endsAt: Date;
}): Date[] {
  const { startAt, weekdays } = params;
  const sortedWeekdays = [...new Set(weekdays)].sort((a, b) => a - b);
  if (sortedWeekdays.length === 0) {
    return [];
  }

  const timeMinutes = getTimeMinutesFromDate(startAt);
  const startDate = toDateOnly(startAt);
  const endDate = toDateOnly(params.endsAt);
  const dates: Date[] = [];

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (sortedWeekdays.includes(cursor.getDay())) {
      const occurrence = buildOccurrenceStartAt(cursor, timeMinutes);
      if (occurrence >= startAt) {
        dates.push(occurrence);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function formatRecurrenceConflictDates(dates: Date[]): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return dates.map((date) => formatter.format(date)).join(", ");
}
