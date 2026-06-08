import {
  PROTOCOL_REQUEST_TYPE_LABELS,
  PROTOCOL_STATUS_LABELS,
} from "./constants";

export function formatProtocolNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

export function getProtocolRequestTypeLabel(value) {
  return PROTOCOL_REQUEST_TYPE_LABELS[value] ?? value;
}

export function getProtocolStatusLabel(value) {
  return PROTOCOL_STATUS_LABELS[value] ?? value;
}

export function formatProtocolDate(value) {
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
