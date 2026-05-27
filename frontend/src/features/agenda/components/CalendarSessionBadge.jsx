import { cn } from "@/lib/utils";
import {
  formatSessionTime,
  getCalendarSessionStyle,
  getSessionFormatLabel,
  getSessionModalityName,
  getSessionRoomName,
  sessionCalendarTooltip,
} from "@/features/agenda/utils";

export function CalendarSessionBadge({ session }) {
  const { container, accent, cancelled } = getCalendarSessionStyle(session);
  const time = formatSessionTime(session.startAt);
  const modalityName = getSessionModalityName(session);
  const roomName = getSessionRoomName(session);
  const formatLabel = getSessionFormatLabel(session.modality);

  return (
    <div
      className={cn(
        "flex min-w-0 items-stretch gap-0.5 overflow-hidden rounded-sm border-l-2 px-1 py-px",
        container,
        accent,
        cancelled && "opacity-55",
      )}
      title={sessionCalendarTooltip(session)}
    >
      <div
        className={cn(
          "min-w-0 flex-1 truncate leading-tight",
          cancelled && "line-through decoration-muted-foreground/70",
        )}
      >
        <p className="truncate text-[9px] font-semibold sm:text-[10px]">
          <span>{time}</span> <span className="font-medium">{modalityName}</span>
        </p>
        <p className="truncate text-[8px] opacity-90 sm:text-[9px]">
          {roomName}
          {formatLabel ? ` · ${formatLabel}` : ""}
        </p>
      </div>
    </div>
  );
}
