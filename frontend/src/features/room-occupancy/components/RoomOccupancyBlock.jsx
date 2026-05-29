import { cn } from "@/lib/utils";
import {
  getCalendarSessionStyle,
  getSessionFormatLabel,
  getSessionModalityName,
  getSessionProfessionals,
  sessionCalendarTooltip,
} from "@/features/agenda/utils";
import { formatSessionTimeRange } from "@/features/room-occupancy/utils";

export function RoomOccupancyBlock({ session, onOpenSession }) {
  const { container, accent } = getCalendarSessionStyle(session);
  const modalityName = getSessionModalityName(session);
  const formatLabel = getSessionFormatLabel(session.modality);
  const professionals = getSessionProfessionals(session)
    .map((item) => item.label)
    .join(", ");
  const timeRange = formatSessionTimeRange(session);

  return (
    <button
      type="button"
      className={cn(
        "absolute inset-x-0.5 z-10 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ama-blue/40",
        container,
        accent,
      )}
      style={{
        top: `${session._gridTop}%`,
        height: `${session._gridHeight}%`,
      }}
      title={sessionCalendarTooltip(session)}
      onClick={() => onOpenSession(session)}
    >
      <p className="truncate text-[10px] font-semibold leading-tight sm:text-[11px]">{timeRange}</p>
      <p className="truncate text-[10px] font-medium leading-tight sm:text-[11px]">{modalityName}</p>
      {professionals ? (
        <p className="truncate text-[9px] opacity-90 sm:text-[10px]">{professionals}</p>
      ) : null}
      {formatLabel ? (
        <p className="truncate text-[9px] opacity-80 sm:text-[10px]">{formatLabel}</p>
      ) : null}
    </button>
  );
}
