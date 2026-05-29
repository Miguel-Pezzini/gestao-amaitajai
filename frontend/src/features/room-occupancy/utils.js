import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_SLOT_MINUTES,
  OCCUPANCY_START_HOUR,
  OCCUPANCY_TOTAL_MINUTES,
} from "@/features/room-occupancy/constants";
import {
  formatSessionTime,
  startOfWeek,
  toCalendarKey,
} from "@/features/agenda/utils";

const WORKDAY_COUNT = 5;

export function buildWorkWeekDays(referenceDate) {
  const weekStart = startOfWeek(referenceDate);
  return Array.from({ length: WORKDAY_COUNT }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index + 1);
    return day;
  });
}

export function workWeekRangeLabel(referenceDate) {
  const days = buildWorkWeekDays(referenceDate);
  const first = days[0];
  const last = days[days.length - 1];

  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });
  const yearFormatter = new Intl.DateTimeFormat("pt-BR", { year: "numeric" });

  if (first.getMonth() === last.getMonth()) {
    return `${dayFormatter.format(first)} – ${dayFormatter.format(last)} de ${monthFormatter.format(first)} de ${yearFormatter.format(first)}`;
  }

  return `${dayFormatter.format(first)} ${monthFormatter.format(first)} – ${dayFormatter.format(last)} ${monthFormatter.format(last)} de ${yearFormatter.format(first)}`;
}

export function navigateWorkWeek(referenceDate, direction) {
  const delta = direction === "next" ? 7 : -7;
  const next = new Date(referenceDate);
  next.setDate(next.getDate() + delta);
  return next;
}

export function isCurrentWorkWeek(referenceDate) {
  const todayKey = toCalendarKey(new Date());
  return buildWorkWeekDays(referenceDate).some((day) => toCalendarKey(day) === todayKey);
}

export function getWorkWeekQueryRange(referenceDate) {
  const days = buildWorkWeekDays(referenceDate);
  const startAt = new Date(days[0]);
  startAt.setHours(0, 0, 0, 0);

  const endAt = new Date(days[days.length - 1]);
  endAt.setHours(23, 59, 59, 999);

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  };
}

export function getSessionRoomId(session) {
  if (!session?.roomId) {
    return "";
  }
  if (typeof session.roomId === "object") {
    return String(session.roomId._id ?? session.roomId.id ?? "");
  }
  return String(session.roomId);
}

export function filterOccupancySessions(sessions, roomId) {
  if (!roomId) {
    return [];
  }

  return sessions.filter(
    (session) => session.status !== "cancelada" && getSessionRoomId(session) === roomId,
  );
}

export function groupSessionsByCalendarDay(sessions) {
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

function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function clampOccupancyWindow(minutes) {
  const startMinutes = OCCUPANCY_START_HOUR * 60;
  const endMinutes = OCCUPANCY_END_HOUR * 60;
  return Math.min(endMinutes, Math.max(startMinutes, minutes));
}

export function sessionToGridMetrics(session) {
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const windowStart = OCCUPANCY_START_HOUR * 60;
  const rawStart = minutesFromMidnight(start);
  const rawEnd = minutesFromMidnight(end);

  const visibleStart = clampOccupancyWindow(rawStart);
  const visibleEnd = clampOccupancyWindow(rawEnd);

  if (visibleEnd <= windowStart || visibleStart >= OCCUPANCY_END_HOUR * 60) {
    return null;
  }

  const offsetMinutes = visibleStart - windowStart;
  const durationMinutes = Math.max(OCCUPANCY_SLOT_MINUTES, visibleEnd - visibleStart);

  return {
    topPercent: (offsetMinutes / OCCUPANCY_TOTAL_MINUTES) * 100,
    heightPercent: (durationMinutes / OCCUPANCY_TOTAL_MINUTES) * 100,
  };
}

export function buildHourLabels() {
  return Array.from(
    { length: OCCUPANCY_END_HOUR - OCCUPANCY_START_HOUR + 1 },
    (_, index) => OCCUPANCY_START_HOUR + index,
  );
}

export function formatHourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatSessionTimeRange(session) {
  const start = formatSessionTime(session.startAt);
  const end = formatSessionTime(session.endAt);
  return `${start} – ${end}`;
}

function formatGapTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function computeDayFreeGaps(sessions) {
  const windowStart = OCCUPANCY_START_HOUR * 60;
  const windowEnd = OCCUPANCY_END_HOUR * 60;

  const intervals = sessions
    .map((session) => {
      const start = new Date(session.startAt);
      const end = new Date(session.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }
      return {
        start: clampOccupancyWindow(minutesFromMidnight(start)),
        end: clampOccupancyWindow(minutesFromMidnight(end)),
      };
    })
    .filter(Boolean)
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start);

  const gaps = [];
  let cursor = windowStart;

  intervals.forEach((interval) => {
    if (interval.start > cursor) {
      gaps.push({
        start: formatGapTime(cursor),
        end: formatGapTime(interval.start),
      });
    }
    cursor = Math.max(cursor, interval.end);
  });

  if (cursor < windowEnd) {
    gaps.push({
      start: formatGapTime(cursor),
      end: formatGapTime(windowEnd),
    });
  }

  return gaps;
}
