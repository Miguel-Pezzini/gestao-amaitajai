import {
  formatSessionTime,
  getSessionRoomName,
  sortSessionsByStart,
} from "@/features/agenda/utils";
import { sessionToGridMetrics } from "@/features/room-occupancy/utils";

export function formatOverlapGroupTimeLabel(block) {
  if (block.endAt) {
    const start = formatSessionTime(block.startAt);
    const end = formatSessionTime(block.endAt);
    if (start !== end) {
      return `${start} – ${end}`;
    }
  }
  return formatSessionTime(block.startAt);
}

function getGridRange(session) {
  return {
    top: session._gridTop,
    bottom: session._gridTop + session._gridHeight,
  };
}

function rangesOverlap(left, right) {
  return left.top < right.bottom && right.top < left.bottom;
}

function findOverlapClusters(sessions) {
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
        rangesOverlap(getGridRange(sessions[leftIndex]), getGridRange(sessions[rightIndex]))
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

function sortByRoom(sessions) {
  return [...sessions].sort((left, right) =>
    getSessionRoomName(left).localeCompare(getSessionRoomName(right), "pt-BR"),
  );
}

function sortForColumnAssignment(sessions) {
  return [...sessions].sort((left, right) => {
    const topDiff = left._gridTop - right._gridTop;
    if (topDiff !== 0) {
      return topDiff;
    }
    const leftSpan = left._gridTop + left._gridHeight;
    const rightSpan = right._gridTop + right._gridHeight;
    return rightSpan - leftSpan;
  });
}

function assignOverlapColumns(cluster) {
  const sorted = sortForColumnAssignment(cluster);
  const columns = [];

  sorted.forEach((session) => {
    let columnIndex = 0;

    while (true) {
      const column = columns[columnIndex] ?? [];
      const overlaps = column.some((existing) =>
        rangesOverlap(getGridRange(session), getGridRange(existing)),
      );

      if (!overlaps) {
        column.push(session);
        columns[columnIndex] = column;
        session._gridColumn = columnIndex;
        break;
      }

      columnIndex += 1;
    }
  });

  const columnCount = columns.length;
  sorted.forEach((session) => {
    session._gridColumnCount = columnCount;
  });

  return sorted;
}

/**
 * Blocos da grade semana/dia:
 * - uma sessão isolada → bloco individual (largura total)
 * - sessões com intervalos sobrepostos → um bloco agrupado (diálogo com a lista)
 */
export function prepareAgendaTimeGridBlocks(sessions) {
  const withMetrics = sessions
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

  const clusters = findOverlapClusters(withMetrics);

  return clusters
    .map((cluster) => {
      if (cluster.length === 1) {
        return {
          type: "single",
          session: cluster[0],
          _gridTop: cluster[0]._gridTop,
        };
      }

      const group = sortByRoom(cluster);
      const top = Math.min(...group.map((item) => item._gridTop));
      const bottom = Math.max(...group.map((item) => item._gridTop + item._gridHeight));
      const earliest = sortSessionsByStart(group)[0];

      return {
        type: "group",
        id: `overlap-${group.map((item) => item._id).sort().join("-")}`,
        sessions: group,
        startAt: earliest.startAt,
        endAt: group.reduce((latest, item) => {
          const end = new Date(item.endAt).getTime();
          return end > new Date(latest).getTime() ? item.endAt : latest;
        }, group[0].endAt),
        _gridTop: top,
        _gridHeight: bottom - top,
      };
    })
    .sort((left, right) => left._gridTop - right._gridTop);
}

/**
 * Vista diária: sessões sobrepostas ficam lado a lado (colunas) em vez de agrupadas.
 */
export function prepareAgendaDaySideBySideBlocks(sessions) {
  const withMetrics = sessions
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

  const clusters = findOverlapClusters(withMetrics);

  return clusters
    .flatMap((cluster) => {
      if (cluster.length === 1) {
        return [
          {
            type: "single",
            session: { ...cluster[0], _gridColumn: 0, _gridColumnCount: 1 },
          },
        ];
      }

      return assignOverlapColumns(cluster).map((session) => ({
        type: "single",
        session,
      }));
    })
    .sort((left, right) => left.session._gridTop - right.session._gridTop);
}
