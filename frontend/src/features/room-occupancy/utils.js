import {
  OCCUPANCY_END_HOUR,
  OCCUPANCY_SLOT_MINUTES,
  OCCUPANCY_START_HOUR,
  OCCUPANCY_TOTAL_MINUTES,
  OCCUPANCY_TOTAL_SLOTS,
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

export function prepareGridSessions(sessions) {
  return sessions
    .map((session) => {
      const metrics = sessionToGridMetrics(session);
      if (!metrics) {
        return null;
      }
      return {
        ...session,
        _gridTop: metrics.topPercent,
        _gridHeight: metrics.heightPercent,
      };
    })
    .filter(Boolean);
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

function formatMinutesLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Rótulos do eixo vertical (intervalos de 15 min, 8h–18h). */
export function buildTimeAxisLabels() {
  const labels = [];
  const windowStart = OCCUPANCY_START_HOUR * 60;

  for (let slot = 0; slot <= OCCUPANCY_TOTAL_SLOTS; slot += 1) {
    const minutes = windowStart + slot * OCCUPANCY_SLOT_MINUTES;
    labels.push({
      label: formatMinutesLabel(minutes),
      topPercent: (slot * OCCUPANCY_SLOT_MINUTES) / OCCUPANCY_TOTAL_MINUTES * 100,
      isHour: minutes % 60 === 0,
    });
  }

  return labels;
}

/**
 * Linhas horizontais da grade (15 min).
 * variant: hour | half | quarter
 */
export function buildTimeGridSlotLines() {
  const slotCount = OCCUPANCY_TOTAL_SLOTS;
  const lines = [];

  for (let slot = 0; slot <= slotCount; slot += 1) {
    const minutesFromStart = slot * OCCUPANCY_SLOT_MINUTES;
    const isHour = minutesFromStart % 60 === 0;
    const isHalfHour = minutesFromStart % 60 === 30;

    lines.push({
      topPercent: (slot / slotCount) * 100,
      variant: isHour ? "hour" : isHalfHour ? "half" : "quarter",
    });
  }

  return lines;
}

function getSessionGridRange(session) {
  return {
    top: session._gridTop,
    bottom: session._gridTop + session._gridHeight,
  };
}

function sessionRangesOverlap(left, right) {
  return left.top < right.bottom && right.top < left.bottom;
}

function findSessionOverlapClusters(sessions) {
  if (sessions.length === 0) {
    return [];
  }

  if (sessions.length === 1) {
    return [sessions];
  }

  const parent = sessions.map((_, index) => index);

  function find(index) {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }
    return parent[index];
  }

  function union(leftIndex, rightIndex) {
    const leftRoot = find(leftIndex);
    const rightRoot = find(rightIndex);
    if (leftRoot !== rightRoot) {
      parent[rightRoot] = leftRoot;
    }
  }

  for (let leftIndex = 0; leftIndex < sessions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sessions.length; rightIndex += 1) {
      if (
        sessionRangesOverlap(
          getSessionGridRange(sessions[leftIndex]),
          getSessionGridRange(sessions[rightIndex]),
        )
      ) {
        union(leftIndex, rightIndex);
      }
    }
  }

  const clusters = new Map();
  sessions.forEach((session, index) => {
    const root = find(index);
    const bucket = clusters.get(root) ?? [];
    bucket.push(session);
    clusters.set(root, bucket);
  });

  return [...clusters.values()];
}

export function prepareOccupancyGridBlocks(sessions) {
  const positioned = prepareGridSessions(sessions);
  const clusters = findSessionOverlapClusters(positioned);

  return clusters
    .map((cluster) => {
      if (cluster.length === 1) {
        return { type: "single", session: cluster[0] };
      }

      const sorted = [...cluster].sort(
        (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      );
      const top = Math.min(...cluster.map((item) => item._gridTop));
      const bottom = Math.max(...cluster.map((item) => item._gridTop + item._gridHeight));

      return {
        type: "group",
        id: `overlap-${sorted.map((item) => item._id).join("-")}`,
        sessions: sorted,
        startAt: sorted[0].startAt,
        endAt: sorted.reduce((latest, item) => {
          const end = new Date(item.endAt).getTime();
          return end > latest ? item.endAt : latest;
        }, sorted[0].endAt),
        _gridTop: top,
        _gridHeight: bottom - top,
      };
    })
    .sort((left, right) => left._gridTop - right._gridTop);
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
