import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { RoomOccupancyBlock } from "@/features/room-occupancy/components/RoomOccupancyBlock";
import {
  formatSessionTime,
  getSessionModalityName,
  getSessionProfessionals,
} from "@/features/agenda/utils";
import { formatSessionTimeRange } from "@/features/room-occupancy/utils";

const INLINE_PREVIEW_LIMIT = 2;

function getGroupTimeLabel(block) {
  if (block.endAt) {
    const start = formatSessionTime(block.startAt);
    const end = formatSessionTime(block.endAt);
    if (start !== end) {
      return `${start} – ${end}`;
    }
  }
  return formatSessionTime(block.startAt);
}

function SessionPreviewLine({ session }) {
  const modalityName = getSessionModalityName(session);
  const professionals = getSessionProfessionals(session)
    .map((item) => item.label)
    .join(", ");

  return (
    <p className="truncate text-[9px] leading-tight text-ama-blue-dark/90 sm:text-[10px]">
      <span className="font-medium">{formatSessionTimeRange(session)}</span>
      <span className="text-muted-foreground"> · </span>
      {modalityName}
      {professionals ? (
        <>
          <span className="text-muted-foreground"> · </span>
          {professionals}
        </>
      ) : null}
    </p>
  );
}

export function RoomOccupancySessionGroup({ block, onOpenSession }) {
  const [open, setOpen] = useState(false);
  const { sessions, _gridTop, _gridHeight } = block;
  const count = sessions.length;
  const timeLabel = getGroupTimeLabel(block);
  const previewSessions = sessions.slice(0, INLINE_PREVIEW_LIMIT);
  const remaining = count - previewSessions.length;

  return (
    <>
      <button
        type="button"
        className="absolute inset-x-0.5 z-10 flex flex-col overflow-hidden rounded-md border border-ama-cyan/35 border-l-[3px] border-l-ama-blue bg-ama-light/95 px-1.5 py-1 text-left shadow-sm transition hover:border-ama-blue/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ama-blue/40"
        style={{
          top: `${_gridTop}%`,
          height: `${_gridHeight}%`,
          minHeight: "2.25rem",
        }}
        onClick={() => setOpen(true)}
        title={`${count} atendimentos (${timeLabel}). Clique para ver todos.`}
      >
        <p className="truncate text-[10px] font-semibold leading-tight text-ama-blue sm:text-[11px]">
          {timeLabel} · {count} atendimentos
        </p>

        {previewSessions.map((session) => (
          <SessionPreviewLine key={session._id} session={session} />
        ))}

        {remaining > 0 ? (
          <p className="truncate text-[9px] font-medium text-ama-blue sm:text-[10px]">
            +{remaining} {remaining === 1 ? "outro" : "outros"}
          </p>
        ) : null}
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Atendimentos ${timeLabel}`}
        description={`${count} atendimento(s) com horários sobrepostos nesta sala.`}
        className="sm:max-w-lg"
      >
        <ul className="flex max-h-[min(70vh,24rem)] flex-col gap-2 overflow-y-auto">
          {sessions.map((session) => (
            <li key={session._id}>
              <RoomOccupancyBlock
                session={session}
                onOpenSession={(item) => {
                  setOpen(false);
                  onOpenSession(item);
                }}
              />
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
