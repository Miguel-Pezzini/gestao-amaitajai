import { TIME_GRID_SESSION_ATTR } from "@/features/agenda/utils/timeGridClick";
import { getSessionPatients, getSessionRoomName } from "@/features/agenda/utils";
import { formatOverlapGroupTimeLabel } from "@/features/agenda/utils/timeGridLayout";
import { cn } from "@/lib/utils";

const INLINE_PREVIEW_LIMIT = 3;

function getParticipantShortLabel(session) {
  const patients = getSessionPatients(session);
  if (patients.length === 0) {
    return "—";
  }
  if (patients.length === 1) {
    return patients[0].label;
  }
  return `${patients.length} pacientes`;
}

function SessionPreviewLine({ session }) {
  const roomName = getSessionRoomName(session);
  const participant = getParticipantShortLabel(session);

  return (
    <p className="truncate text-[9px] leading-tight text-ama-blue-dark/90 sm:text-[10px]">
      <span className="font-medium">{roomName}</span>
      <span className="text-muted-foreground"> · </span>
      {participant}
    </p>
  );
}

export function TimeGridSessionGroup({ block, onOpenGroup, compact = false }) {
  const { sessions, _gridTop, _gridHeight } = block;
  const count = sessions.length;
  const timeLabel = formatOverlapGroupTimeLabel(block);
  const previewSessions = sessions.slice(0, INLINE_PREVIEW_LIMIT);
  const remaining = count - previewSessions.length;

  return (
    <button
      type="button"
      {...{ [TIME_GRID_SESSION_ATTR]: "" }}
      className={cn(
        "absolute inset-x-0.5 z-10 flex cursor-pointer flex-col overflow-hidden rounded-md border border-ama-cyan/35 border-l-[3px] border-l-ama-blue bg-ama-light/95 px-1.5 py-1 text-left shadow-sm transition hover:border-ama-blue/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ama-blue/40",
        compact ? "gap-0" : "gap-0.5",
      )}
      style={{
        top: `${_gridTop}%`,
        height: `${_gridHeight}%`,
        minHeight: compact ? "2.25rem" : "2.75rem",
      }}
      onClick={(event) => {
        event.stopPropagation();
        onOpenGroup(block);
      }}
      title={`${count} sessões (${timeLabel}). Clique para ver todas.`}
    >
      <p className="truncate text-[10px] font-semibold leading-tight text-ama-blue sm:text-[11px]">
        {timeLabel} · {count} sessões
      </p>

      {previewSessions.map((session) => (
        <SessionPreviewLine key={session._id} session={session} />
      ))}

      {remaining > 0 ? (
        <p className="truncate text-[9px] font-medium text-ama-blue sm:text-[10px]">
          +{remaining} {remaining === 1 ? "outra" : "outras"}
        </p>
      ) : null}
    </button>
  );
}
