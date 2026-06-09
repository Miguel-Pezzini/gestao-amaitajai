export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export const CANCEL_SCOPE_OPTIONS = [
  { value: "single", label: "Somente este evento" },
  { value: "future", label: "Este e os eventos futuros" },
  { value: "all", label: "Todos os eventos da série" },
];

export function getWeekdayFromDateString(dateString) {
  if (!dateString) {
    return null;
  }
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getDay();
}

export function defaultRecurrenceEndsAt(startDate) {
  if (!startDate) {
    return "";
  }
  const year = startDate.slice(0, 4);
  return `${year}-12-31`;
}

export function toggleWeekday(weekdays, weekday) {
  if (weekdays.includes(weekday)) {
    return weekdays.filter((item) => item !== weekday);
  }
  return [...weekdays, weekday].sort((a, b) => a - b);
}
