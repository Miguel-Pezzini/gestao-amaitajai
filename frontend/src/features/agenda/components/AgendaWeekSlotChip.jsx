import { cn } from "@/lib/utils";
import {
  getCalendarSessionStyle,
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

export function AgendaWeekSlotChip({ session, onOpenSession }) {
  const { container, accent } = getCalendarSessionStyle(session);
  const roomName = getSessionRoomName(session);
  const modalityName = getSessionModalityName(session);
  const participantLabel = getParticipantLabel(session);

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
