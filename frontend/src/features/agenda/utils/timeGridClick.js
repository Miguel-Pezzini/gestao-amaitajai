import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_SLOT_MINUTES,
  OCCUPANCY_START_HOUR,
  OCCUPANCY_TOTAL_MINUTES,
} from "@/features/room-occupancy/constants";

export const TIME_GRID_SESSION_ATTR = "data-time-grid-session";

/** Converte clique na coluna da grade em horário (HH:mm) alinhado a 15 min. */
export function getTimeKeyFromGridClick(clientY, gridElement) {
  const rect = gridElement.getBoundingClientRect();
  if (rect.height <= 0) {
    return "09:00";
  }

  const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  const rawMinutes = Math.floor(ratio * OCCUPANCY_TOTAL_MINUTES);
  const snapped =
    Math.floor(rawMinutes / OCCUPANCY_SLOT_MINUTES) * OCCUPANCY_SLOT_MINUTES;
  const windowStart = OCCUPANCY_START_HOUR * 60;
  const windowEnd = OCCUPANCY_END_HOUR * 60;
  const absolute = Math.min(windowEnd - OCCUPANCY_SLOT_MINUTES, windowStart + snapped);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
