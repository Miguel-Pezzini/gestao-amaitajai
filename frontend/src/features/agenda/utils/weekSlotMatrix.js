import {
  getSessionRoomName,
  sortSessionsByStart,
  toCalendarKey,
} from "@/features/agenda/utils";
import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_SLOT_MINUTES,
  OCCUPANCY_START_HOUR,
} from "@/features/room-occupancy/constants";

export function getSessionStartTimeKey(session) {
  const date = new Date(session.startAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function timeKeyToMinutes(timeKey) {
  const [hours, minutes] = timeKey.split(":").map(Number);
  return hours * 60 + minutes;
}

function isTimeKeyInAgendaWindow(timeKey) {
  if (!timeKey) {
    return false;
  }
  const minutes = timeKeyToMinutes(timeKey);
  return minutes >= OCCUPANCY_START_HOUR * 60 && minutes < OCCUPANCY_END_HOUR * 60;
}

export function buildAllAgendaTimeSlotKeys() {
  const keys = [];

  for (let hour = OCCUPANCY_START_HOUR; hour < OCCUPANCY_END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += OCCUPANCY_SLOT_MINUTES) {
      keys.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
  }

  return keys;
}

export function buildWeekTimeSlotKeys(grouped, days) {
  const keys = new Set(buildAllAgendaTimeSlotKeys());

  days.forEach((day) => {
    const dayKey = toCalendarKey(day);
    const sessions = grouped[dayKey] ?? [];
    sessions.forEach((session) => {
      const timeKey = getSessionStartTimeKey(session);
      if (isTimeKeyInAgendaWindow(timeKey)) {
        keys.add(timeKey);
      }
    });
  });

  return [...keys].sort((left, right) => timeKeyToMinutes(left) - timeKeyToMinutes(right));
}

export function getSessionsAtTimeSlot(grouped, day, timeKey) {
  const dayKey = toCalendarKey(day);
  const sessions = grouped[dayKey] ?? [];
  const matches = sessions.filter((session) => getSessionStartTimeKey(session) === timeKey);

  return sortSessionsByStart(matches).sort((left, right) =>
    getSessionRoomName(left).localeCompare(getSessionRoomName(right), "pt-BR"),
  );
}

export function formatTimeSlotLabel(timeKey) {
  return timeKey;
}
