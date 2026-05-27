export function normalizeRole(role) {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (normalized === "admin") {
    return "administrador";
  }
  if (normalized === "therapist") {
    return "tecnico";
  }
  return normalized;
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export function formatDayNumber(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
}

export function formatWeekdayShort(date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date);
}

/** Cabeçalho domingo → sábado; dias úteis (seg–sex) no centro. */
export const WEEKDAY_HEADERS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function toCalendarKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupSessionsByDay(sessions) {
  return sessions.reduce((acc, session) => {
    const date = new Date(session.startAt);
    if (Number.isNaN(date.getTime())) {
      return acc;
    }
    const key = toCalendarKey(date);
    const bucket = acc[key] ?? [];
    bucket.push(session);
    acc[key] = bucket;
    return acc;
  }, {});
}

export function sessionSummary(session) {
  const typeName = session?.sessionTypeId?.name ?? "Tipo";
  const roomName = session?.roomId?.name ?? "Sala";
  return `${typeName} · ${session.modality} · ${roomName}`;
}

export function statusBadgeClass(status) {
  if (status === "realizada") {
    return "bg-ama-light text-ama-blue-dark";
  }
  if (status === "cancelada") {
    return "border-destructive/40 text-destructive";
  }
  return "border-ama-cyan text-ama-blue";
}
