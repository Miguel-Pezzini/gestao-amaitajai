import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarSessionBadge } from "@/features/agenda/components/CalendarSessionBadge";
import { sortSessionsByStart } from "@/features/agenda/utils";

const GAP_PX = 2;
const ELLIPSIS_HEIGHT_PX = 11;

function computeVisibleCount(badgeHeights, containerHeight) {
  const total = badgeHeights.length;
  if (total === 0 || containerHeight <= 0) {
    return { count: 0, overflow: false };
  }

  for (let count = total; count >= 1; count -= 1) {
    let used = 0;
    for (let index = 0; index < count; index += 1) {
      used += badgeHeights[index] + (index > 0 ? GAP_PX : 0);
    }

    const needsEllipsis = count < total;
    const required = used + (needsEllipsis ? ELLIPSIS_HEIGHT_PX : 0);
    if (required <= containerHeight) {
      return { count, overflow: needsEllipsis };
    }
  }

  return { count: 0, overflow: true };
}

export function CalendarDaySessions({ sessions }) {
  const sorted = useMemo(() => sortSessionsByStart(sessions), [sessions]);
  const sessionIds = useMemo(
    () => sorted.map((session) => session._id).join("|"),
    [sorted],
  );
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(sorted.length);
  const [hasOverflow, setHasOverflow] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      return undefined;
    }

    const update = () => {
      const badgeHeights = Array.from(measure.children).map((node) => node.offsetHeight);
      const { count, overflow } = computeVisibleCount(
        badgeHeights,
        container.clientHeight,
      );
      setVisibleCount(count);
      setHasOverflow(overflow);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [sessionIds, sorted.length]);

  if (sorted.length === 0) {
    return null;
  }

  const visible = sorted.slice(0, visibleCount);

  return (
    <div
      ref={containerRef}
      className="relative mt-0.5 flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {visible.map((session) => (
          <CalendarSessionBadge key={session._id} session={session} />
        ))}
      </div>

      {hasOverflow ? (
        <p
          className="shrink-0 truncate pb-px text-center text-[10px] font-semibold leading-none text-ama-blue sm:text-[11px]"
          aria-hidden
        >
          ...
        </p>
      ) : null}

      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 -z-10 flex flex-col gap-0.5"
      >
        {sorted.map((session) => (
          <CalendarSessionBadge key={`measure-${session._id}`} session={session} />
        ))}
      </div>
    </div>
  );
}
