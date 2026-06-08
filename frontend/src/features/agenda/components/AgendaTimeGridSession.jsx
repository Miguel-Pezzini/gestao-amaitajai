import { TIME_GRID_SESSION_ATTR } from "@/features/agenda/utils/timeGridClick";
import { cn } from "@/lib/utils";
import {
  formatSessionTime,
  getCalendarSessionStyle,
  getSessionFormatLabel,
  getSessionModalityName,
  getSessionPatients,
  getSessionRoomName,
  sessionCalendarTooltip,
} from "@/features/agenda/utils";

function getParticipantLabel(session) {
  const patients = getSessionPatients(session);
  if (patients.length === 0) {
    return "Não informado";
  }
  if (session.modality === "grupo") {
    return `Grupo: ${patients.map((item) => item.label).join(", ")}`;
  }
  if (patients.length === 1) {
    return patients[0].label;
  }
  return patients.map((item) => item.label).join(", ");
}

const SESSION_INSET_PX = 2;

export function AgendaTimeGridSession({ session, onOpenSession, compact = false }) {
  const { container, accent } = getCalendarSessionStyle(session);
  const modalityName = getSessionModalityName(session);
  const roomName = getSessionRoomName(session);
  const formatLabel = getSessionFormatLabel(session.modality);
  const time = formatSessionTime(session.startAt);
  const participantLabel = getParticipantLabel(session);
  const columnIndex = session._gridColumn ?? 0;
  const columnCount = session._gridColumnCount ?? 1;
  const columnWidthPercent = 100 / columnCount;
  const leftPercent = columnIndex * columnWidthPercent;

  return (
    <button
      type="button"
      {...{ [TIME_GRID_SESSION_ATTR]: "" }}
      className={cn(
        "absolute z-10 cursor-pointer overflow-hidden rounded-md border-l-[3px] px-1 py-1 text-left shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ama-blue/40",
        container,
        accent,
      )}
      style={{
        top: `${session._gridTop}%`,
        height: `${session._gridHeight}%`,
        left:
          columnCount === 1
            ? `${SESSION_INSET_PX}px`
            : `calc(${leftPercent}% + ${SESSION_INSET_PX}px)`,
        width:
          columnCount === 1
            ? `calc(100% - ${SESSION_INSET_PX * 2}px)`
            : `calc(${columnWidthPercent}% - ${SESSION_INSET_PX * 2}px)`,
      }}
      title={sessionCalendarTooltip(session)}
      onClick={(event) => {
        event.stopPropagation();
        onOpenSession(session);
      }}
    >
      {compact ? (
        <>
          <p className="truncate text-[10px] font-semibold leading-tight sm:text-[11px]">
            {roomName}
          </p>
          <p className="truncate text-[9px] leading-tight opacity-90 sm:text-[10px]">
            {participantLabel}
          </p>
          <p className="truncate text-[9px] leading-tight opacity-80 sm:text-[10px]">
            {modalityName}
          </p>
        </>
      ) : (
        <>
          <p className="truncate text-[10px] font-semibold leading-tight sm:text-[11px]">
            {time} · {modalityName}
          </p>
          <p className="truncate text-[9px] opacity-90 sm:text-[10px]">{roomName}</p>
          {formatLabel ? (
            <p className="truncate text-[9px] opacity-80 sm:text-[10px]">{formatLabel}</p>
          ) : null}
        </>
      )}
    </button>
  );
}
