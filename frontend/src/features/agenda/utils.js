import { SESSION_FORMAT_LABELS } from "@/features/cadastros/constants";

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

const CALENDAR_MODALITY_PALETTE = [
  "bg-sky-50 text-sky-950",
  "bg-cyan-50 text-cyan-950",
  "bg-teal-50 text-teal-950",
  "bg-indigo-50 text-indigo-950",
  "bg-violet-50 text-violet-950",
  "bg-rose-50 text-rose-950",
  "bg-amber-50 text-amber-950",
  "bg-emerald-50 text-emerald-950",
];

const SESSION_FORMAT_ACCENT = {
  individual: "border-l-sky-500",
  dupla: "border-l-violet-500",
  grupo: "border-l-emerald-600",
};

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

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
  const modalityKey =
    session?.sessionTypeId?.slug ??
    session?.sessionTypeId?._id ??
    session?.sessionTypeId ??
    "default";
  const paletteIndex = hashString(String(modalityKey)) % CALENDAR_MODALITY_PALETTE.length;
  const container = CALENDAR_MODALITY_PALETTE[paletteIndex];
  const accent = SESSION_FORMAT_ACCENT[session?.modality] ?? SESSION_FORMAT_ACCENT.individual;

  return {
    container,
    accent,
    cancelled: session?.status === "cancelada",
  };
}

export function sessionCalendarTooltip(session) {
  const modalityName = getSessionModalityName(session);
  const roomName = getSessionRoomName(session);
  const formatLabel = getSessionFormatLabel(session?.modality);
  const time = formatSessionTime(session?.startAt);
  return `${time} · ${modalityName} · ${roomName} · ${formatLabel}`;
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
  if (status === "realizada") {
    return "bg-ama-light text-ama-blue-dark";
  }
  if (status === "cancelada") {
    return "border-destructive/40 text-destructive";
  }
  return "border-ama-cyan text-ama-blue";
}

export const SESSION_STATUS_LABELS = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export function getSessionStatusLabel(status) {
  return SESSION_STATUS_LABELS[status] ?? status ?? "";
}

export function getSessionPatients(session) {
  const items = session?.patientIds ?? [];
  return items.map((item) => {
    if (item && typeof item === "object") {
      return {
        id: String(item._id ?? item.id ?? ""),
        label: item.fullName ?? "Paciente",
        fundingSource: item.fundingSource ?? "",
      };
    }
    return { id: String(item), label: "Paciente", fundingSource: "" };
  });
}

export function getSessionProfessionals(session) {
  const items = session?.professionalIds ?? [];
  return items.map((item) => {
    if (item && typeof item === "object") {
      return {
        id: String(item._id ?? item.id ?? ""),
        label: item.name ?? "Profissional",
        email: item.email ?? "",
        role: item.role ?? "",
      };
    }
    return { id: String(item), label: "Profissional", email: "", role: "" };
  });
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
