import { SESSION_FORMAT_LABELS } from "@/features/cadastros/constants";

export function normalizeRole(role) {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (normalized === "ADMIN") {
    return "ADMINISTRADOR";
  }
  if (normalized === "THERAPIST") {
    return "TECNICO";
  }
  return normalized;
}

const SESSION_STATUS_CALENDAR_STYLES = {
  AGENDADA: {
    container: "bg-amber-50 text-amber-950",
    accent: "border-l-amber-500",
  },
  REALIZADA: {
    container: "bg-sky-50 text-sky-950",
    accent: "border-l-sky-600",
  },
  CANCELADA: {
    container: "bg-red-50 text-red-950",
    accent: "border-l-red-500",
  },
};

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export function formatDayNumber(date) {
  return new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(date);
}

export function formatDayFull(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatWeekdayShort(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

export function formatWeekdayLong(date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

/** Cabeçalho domingo → sábado; dias úteis (seg–sex) no centro. */
export const WEEKDAY_HEADERS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
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

export function isSameCalendarDay(left, right) {
  return toCalendarKey(left) === toCalendarKey(right);
}

export function isToday(date) {
  return isSameCalendarDay(date, new Date());
}

export function isPastCalendarDay(date) {
  return toCalendarKey(date) < toCalendarKey(new Date());
}

export function summarizeDaySessions(sessions, date) {
  const counts = {
    AGENDADA: 0,
    REALIZADA: 0,
    CANCELADA: 0,
  };

  for (const session of sessions ?? []) {
    const status = session?.status;
    if (status === "REALIZADA" || status === "CANCELADA" || status === "AGENDADA") {
      counts[status] += 1;
    }
  }

  const total = sessions?.length ?? 0;
  const hasPending = isPastCalendarDay(date) && counts.AGENDADA > 0;
  const isDayFinished = total > 0 && counts.AGENDADA === 0;

  return {
    total,
    ...counts,
    hasPending,
    isDayFinished,
  };
}

export function formatMonthDaySummaryLabel(summary) {
  if (!summary?.total) {
    return "Sem sessões";
  }

  const parts = [
    `${summary.total} ${summary.total === 1 ? "sessão" : "sessões"}`,
    `${summary.REALIZADA} realizada${summary.REALIZADA === 1 ? "" : "s"}`,
    `${summary.AGENDADA} agendada${summary.AGENDADA === 1 ? "" : "s"}`,
    `${summary.CANCELADA} cancelada${summary.CANCELADA === 1 ? "" : "s"}`,
  ];

  if (summary.hasPending) {
    parts.push("pendências de registro");
  } else if (summary.isDayFinished) {
    parts.push("dia encerrado");
  }

  return parts.join(", ");
}

export function isCurrentAgendaPeriod(referenceDate, viewMode) {
  const today = new Date();

  if (viewMode === "day") {
    return isSameCalendarDay(referenceDate, today);
  }

  if (viewMode === "week") {
    const todayKey = toCalendarKey(today);
    return buildWeekDays(referenceDate).some((day) => toCalendarKey(day) === todayKey);
  }

  return (
    referenceDate.getFullYear() === today.getFullYear()
    && referenceDate.getMonth() === today.getMonth()
  );
}

export function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function buildWeekDays(referenceDate) {
  const start = startOfWeek(referenceDate);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function buildMonthGrid(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  const leadingEmpty = firstDay.getDay();
  const emptyCells = Array.from({ length: leadingEmpty }, (_, idx) => `empty-${idx}`);
  return { days, emptyCells };
}

export function weekRangeLabel(referenceDate) {
  const days = buildWeekDays(referenceDate);
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const yearFormatter = new Intl.DateTimeFormat("pt-BR", { year: "numeric" });

  if (sameMonth && sameYear) {
    return `${dayFormatter.format(first)} – ${dayFormatter.format(last)} de ${monthLabel(first)}`;
  }

  if (sameYear) {
    return `${dayFormatter.format(first)} ${monthFormatter.format(first)} – ${dayFormatter.format(last)} ${monthFormatter.format(last)} de ${yearFormatter.format(first)}`;
  }

  return `${dayFormatter.format(first)} ${monthFormatter.format(first)} ${yearFormatter.format(first)} – ${dayFormatter.format(last)} ${monthFormatter.format(last)} ${yearFormatter.format(last)}`;
}

export function navigateReferenceDate(referenceDate, viewMode, direction) {
  const delta = direction === "next" ? 1 : -1;
  const next = new Date(referenceDate);

  if (viewMode === "day") {
    next.setDate(next.getDate() + delta);
    return next;
  }

  if (viewMode === "week") {
    next.setDate(next.getDate() + delta * 7);
    return next;
  }

  return new Date(next.getFullYear(), next.getMonth() + delta, 1);
}

export function referenceDateLabel(referenceDate, viewMode) {
  if (viewMode === "day") {
    return formatDayFull(referenceDate);
  }
  if (viewMode === "week") {
    return weekRangeLabel(referenceDate);
  }
  return monthLabel(referenceDate);
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

export function formatSessionTime(value) {
  if (!value) {
    return "--:--";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--:--";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function combineStartDateTime(startDate, startTime) {
  if (!startDate || !startTime) {
    return "";
  }
  return `${startDate}T${startTime}`;
}

export function splitStartDateTime(value) {
  if (!value) {
    return { startDate: "", startTime: "" };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const [datePart, timePart] = String(value).split("T");
    return {
      startDate: datePart ?? "",
      startTime: timePart?.slice(0, 5) ?? "",
    };
  }
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return {
    startDate: local.toISOString().slice(0, 10),
    startTime: local.toISOString().slice(11, 16),
  };
}

export function getSessionModalityName(session) {
  return session?.sessionTypeId?.name ?? "Modalidade";
}

export function getSessionRoomName(session) {
  return session?.roomId?.name ?? "Sala";
}

export function getSessionFormatLabel(modality) {
  return SESSION_FORMAT_LABELS[modality] ?? modality ?? "";
}

export function getCalendarSessionStyle(session) {
  const status = session?.status ?? "AGENDADA";
  const styles =
    SESSION_STATUS_CALENDAR_STYLES[status] ?? SESSION_STATUS_CALENDAR_STYLES.AGENDADA;

  return {
    container: styles.container,
    accent: styles.accent,
  };
}

export function sessionCalendarTooltip(session) {
  const modalityName = getSessionModalityName(session);
  const roomName = getSessionRoomName(session);
  const formatLabel = getSessionFormatLabel(session?.modality);
  const time = formatSessionTime(session?.startAt);
  const statusLabel = getSessionStatusLabel(session?.status);
  return `${time} · ${statusLabel} · ${modalityName} · ${roomName} · ${formatLabel}`;
}

export function sortSessionsByStart(sessions) {
  return [...sessions].sort(
    (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
  );
}

export function sessionSummary(session) {
  const modalityName = getSessionModalityName(session);
  const roomName = getSessionRoomName(session);
  const formatLabel = getSessionFormatLabel(session?.modality);
  return `${modalityName} · ${formatLabel} · ${roomName}`;
}

export function statusBadgeClass(status) {
  if (status === "REALIZADA") {
    return "bg-ama-light text-ama-blue-dark";
  }
  if (status === "CANCELADA") {
    return "border-destructive/40 text-destructive";
  }
  return "border-ama-cyan text-ama-blue";
}

export const SESSION_STATUS_LABELS = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

export function getSessionStatusLabel(status) {
  return SESSION_STATUS_LABELS[status] ?? status ?? "";
}

function mapParticipantRefs(items, labelKey, defaultLabel, extraFields) {
  return (items ?? []).map((item) => {
    if (item && typeof item === "object") {
      return {
        id: String(item._id ?? item.id ?? ""),
        label: item[labelKey] ?? defaultLabel,
        ...extraFields(item),
      };
    }
    return { id: String(item), label: defaultLabel, ...extraFields(null) };
  });
}

export function getSessionPatients(session) {
  return mapParticipantRefs(session?.patientIds, "fullName", "Paciente", (item) => ({
    fundingSource: item?.fundingSource ?? "",
  }));
}

export function getSessionProfessionals(session) {
  return mapParticipantRefs(session?.professionalIds, "name", "Profissional", (item) => ({
    email: item?.email ?? "",
    role: item?.role ?? "",
  }));
}

export function getSessionParticipantLabel(session) {
  const patients = getSessionPatients(session);
  if (patients.length === 0) {
    return "Não informado";
  }
  if (session.modality === "GRUPO") {
    return `Grupo: ${patients.map((item) => item.label).join(", ")}`;
  }
  if (patients.length === 1) {
    return patients[0].label;
  }
  return patients.map((item) => item.label).join(", ");
}

export function formatSessionDateTime(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsed);
}

const AVAILABILITY_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function getSessionFormSlotQuery(form) {
  const durationMinutes = Number.parseInt(String(form.durationMinutes ?? ""), 10);
  if (!form.startDate || !form.startTime || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null;
  }

  const startAt = new Date(combineStartDateTime(form.startDate, form.startTime));
  if (Number.isNaN(startAt.getTime())) {
    return null;
  }

  return {
    startAt: startAt.toISOString(),
    durationMinutes,
  };
}

export function formatAvailabilityRangeLabel(meta) {
  if (!meta?.startAt || !meta?.endAt) {
    return "";
  }
  const start = new Date(meta.startAt);
  const end = new Date(meta.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }
  return `${AVAILABILITY_TIME_FORMATTER.format(start)} às ${AVAILABILITY_TIME_FORMATTER.format(end)}`;
}

export function formatAvailabilityBadge(meta) {
  if (!meta || meta.requiresSearch) {
    return "";
  }
  const count = meta.availableCount ?? 0;
  return `${count} livre${count === 1 ? "" : "s"}`;
}

export function formatConflictSessionLabel(conflictSession) {
  if (!conflictSession) {
    return "";
  }
  const parts = ["Ocupado"];
  const typeName = conflictSession.sessionTypeName?.trim();
  const roomName = conflictSession.roomName?.trim();
  if (typeName) {
    parts.push(typeName);
  }
  if (roomName) {
    parts.push(roomName);
  }
  return parts.join(" · ");
}
