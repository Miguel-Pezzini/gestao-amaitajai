import { cn } from "@/lib/utils";
import {
  getCalendarSessionStyle,
  getSessionModalityName,
  getSessionParticipantLabel,
  getSessionRoomName,
  sessionCalendarTooltip,
} from "@/features/agenda/utils";

export function AgendaWeekSlotChip({ session, onOpenSession }) {
  const { container, accent } = getCalendarSessionStyle(session);
  const roomName = getSessionRoomName(session);
  const modalityName = getSessionModalityName(session);
  const participantLabel = getSessionParticipantLabel(session);

  return (
    <button
      type="button"
      className={cn(
        "min-w-0 rounded border-l-[3px] px-1.5 py-1 text-left transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ama-blue/40",
        container,
        accent,
      )}
      title={sessionCalendarTooltip(session)}
      onClick={() => onOpenSession(session)}
    >
      <p className="truncate text-[10px] font-semibold leading-tight text-inherit sm:text-[11px]">
        {roomName}
      </p>
      <p className="truncate text-[9px] leading-tight opacity-90 sm:text-[10px]">
        {participantLabel}
      </p>
      <p className="truncate text-[9px] leading-tight opacity-80 sm:text-[10px]">{modalityName}</p>
    </button>
  );
}
