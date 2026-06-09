import { Check, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionParticipantsPreview } from "@/features/agenda/components/SessionParticipants";
import {
  getSessionStatusLabel,
  sessionSummary,
  statusBadgeClass,
} from "@/features/agenda/utils";
import { formatSessionTimeRange } from "@/features/room-occupancy/utils";

export function AgendaSessionCard({
  session,
  onOpenSession,
  onCompleteSession,
  onCancelSession,
  isAdmin,
}) {
  const canComplete = session.status === "AGENDADA";
  const canCancel = isAdmin && session.status !== "CANCELADA";
  const hasActions = canComplete || canCancel;

  return (
    <li className="flex items-start gap-2 px-2 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
      <button
        type="button"
        onClick={() => onOpenSession(session)}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md px-1 py-1 text-left transition hover:bg-ama-light/50 sm:gap-4"
      >
        <time
          dateTime={`${session.startAt}/${session.endAt}`}
          className="min-w-[7.75rem] shrink-0 whitespace-nowrap pt-0.5 text-xs font-semibold tabular-nums text-ama-blue-dark sm:min-w-[9.25rem] sm:text-sm"
        >
          {formatSessionTimeRange(session)}
        </time>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-ama-blue-dark">{sessionSummary(session)}</p>
          <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(session.status)}`}>
            {getSessionStatusLabel(session.status)}
          </Badge>
          <SessionParticipantsPreview session={session} />
          <p className="text-[10px] text-muted-foreground">Clique para ver detalhes</p>
        </div>

        <ChevronRight
          className="mt-1 size-4 shrink-0 text-muted-foreground/60"
          aria-hidden="true"
        />
      </button>

      {hasActions ? (
        <div className="flex shrink-0 flex-col items-stretch gap-0.5 pt-1">
          {canComplete ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-ama-blue-dark hover:bg-ama-light hover:text-ama-blue-dark"
              onClick={() => onCompleteSession(session._id)}
              aria-label="Concluir sessão"
              title="Concluir"
            >
              <Check className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Concluir</span>
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onCancelSession(session._id)}
              aria-label="Cancelar sessão"
              title="Cancelar"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
