import { SESSION_FORMAT_LABELS } from "@/features/cadastros/constants";
import { formatDateTime, formatWeekdayLong } from "@/features/agenda/utils";

function formatReplacementWeekdays(weekdays) {
  if (!Array.isArray(weekdays) || weekdays.length === 0) {
    return "";
  }

  return weekdays
    .map((weekday) => {
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        return "";
      }

      const date = new Date(2024, 0, 7 + weekday);
      const label = formatWeekdayLong(date);
      return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

export function formatReplacementLabel(item) {
  const modalityLabel = SESSION_FORMAT_LABELS[item.modality] ?? item.modality;
  const typeLabel = item.sessionTypeName || "Sessão";

  if (item.type === "series") {
    const weekdays = formatReplacementWeekdays(item.weekdays);
    return weekdays ? `${modalityLabel} · ${typeLabel} · ${weekdays}` : `${modalityLabel} · ${typeLabel}`;
  }

  return `${modalityLabel} · ${typeLabel} · ${formatDateTime(item.nextStartAt)}`;
}

export function formatReplacementMeta(item) {
  const parts = [item.roomName];

  if (item.sessionCount > 1) {
    parts.push(`${item.sessionCount} sessões`);
  }

  return parts.filter(Boolean).join(" · ");
}

export function formatCancellationSummary(count) {
  if (count === 1) {
    return "1 sessão será cancelada automaticamente.";
  }

  return `${count} sessões serão canceladas automaticamente.`;
}

export function buildReplacementPayload(replacements, selections) {
  return replacements.map((item) => {
    const replacementPatientId = selections[item.key];
    if (item.type === "series") {
      return {
        seriesId: item.seriesId,
        replacementPatientId,
      };
    }

    return {
      sessionId: item.sessionId,
      replacementPatientId,
    };
  });
}
