import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { SESSION_FORMAT_LABELS } from "@/features/cadastros/constants";
import { SessionPatientAttendance } from "@/features/agenda/components/SessionPatientAttendance";
import { SessionPatientEvolutions } from "@/features/agenda/components/SessionPatientEvolutions";
import { SessionParticipantsDetail } from "@/features/agenda/components/SessionParticipants";
import { useSessionAttendances } from "@/features/agenda/hooks/useSessionAttendances";
import { listSessionChangeRequests } from "@/services/agenda";
import {
  formatSessionDateTime,
  getSessionFormatLabel,
  getSessionModalityName,
  getSessionRoomName,
  getSessionStatusLabel,
  sessionSummary,
  statusBadgeClass,
} from "@/features/agenda/utils";

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-ama-cyan/10 py-3 last:border-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-ama-blue-dark">{children}</dd>
    </div>
  );
}

export function SessionDetailDialog({
  open,
  onOpenChange,
  session,
  isAdmin,
  onCompleteSession,
  onCancelSession,
  onEditSession,
  onRequestEditSession,
  onRequestCancelSession,
}) {
  const attendance = useSessionAttendances(session?._id, open && !!session);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    if (!open || !session?._id || isAdmin) {
      setHasPendingRequest(false);
      return;
    }

    let mounted = true;

    async function loadPending() {
      try {
        const response = await listSessionChangeRequests({
          sessionId: session._id,
          status: "PENDENTE",
        });
        if (mounted) {
          setHasPendingRequest((response.items ?? []).length > 0);
        }
      } catch {
        if (mounted) {
          setHasPendingRequest(false);
        }
      }
    }

    loadPending();

    return () => {
      mounted = false;
    };
  }, [open, session?._id, isAdmin]);

  if (!session) {
    return null;
  }

  const canComplete = session.status === "AGENDADA" && attendance.canCompleteSession;
  const canEdit = isAdmin && session.status === "AGENDADA";
  const canCancel = isAdmin && session.status !== "CANCELADA";
  const canRequestEdit = !isAdmin && session.status === "AGENDADA" && !hasPendingRequest;
  const canRequestCancel = !isAdmin && session.status === "AGENDADA" && !hasPendingRequest;
  const hasActions =
    canComplete || canCancel || canEdit || canRequestEdit || canRequestCancel || hasPendingRequest;
  const notes = String(session.notes ?? "").trim();
  const cancelReason = String(session.cancelReason ?? "").trim();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      nested
      title={sessionSummary(session)}
      className="sm:max-w-2xl"
    >
      <div className="min-w-0 space-y-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusBadgeClass(session.status)}>
            {getSessionStatusLabel(session.status)}
          </Badge>
          <Badge variant="outline" className="border-ama-cyan/40 text-ama-blue-dark">
            {getSessionFormatLabel(session.modality)}
          </Badge>
          {hasPendingRequest ? (
            <Badge variant="outline" className="border-amber-400/60 bg-amber-50 text-amber-800">
              Pedido pendente
            </Badge>
          ) : null}
        </div>

        <dl className="rounded-lg border border-ama-cyan/20 bg-white px-4">
          <DetailRow label="Início">{formatSessionDateTime(session.startAt)}</DetailRow>
          <DetailRow label="Término">{formatSessionDateTime(session.endAt)}</DetailRow>
          <DetailRow label="Duração">{session.durationMinutes} minutos</DetailRow>
          <DetailRow label="Modalidade">{getSessionModalityName(session)}</DetailRow>
          <DetailRow label="Tipo de sessão">
            {SESSION_FORMAT_LABELS[session.modality] ?? session.modality}
          </DetailRow>
          <DetailRow label="Sala">{getSessionRoomName(session)}</DetailRow>
        </dl>

        <SessionParticipantsDetail session={session} />

        <SessionPatientAttendance
          attendance={attendance}
          readOnly={session.status === "CANCELADA"}
        />

        <SessionPatientEvolutions
          sessionId={session._id}
          sessionStatus={session.status}
          open={open}
          attendanceByPatientId={attendance.effectiveAttendanceByPatientId}
        />

        {notes ? (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notas
            </h3>
            <p className="rounded-md border border-ama-cyan/15 bg-ama-light/30 px-3 py-2 text-sm text-ama-blue-dark">
              {notes}
            </p>
          </section>
        ) : null}

        {session.status === "CANCELADA" && cancelReason ? (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Motivo do cancelamento
            </h3>
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {cancelReason}
            </p>
            {session.cancelledAt ? (
              <p className="text-xs text-muted-foreground">
                Cancelada em {formatSessionDateTime(session.cancelledAt)}
              </p>
            ) : null}
          </section>
        ) : null}

        {hasActions ? (
          <div className="flex flex-col gap-2 border-t border-ama-cyan/15 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
            {canRequestEdit ? (
              <Button
                type="button"
                variant="outline"
                className="border-ama-cyan/40"
                onClick={() => {
                  onOpenChange(false);
                  onRequestEditSession(session._id);
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Solicitar edição
              </Button>
            ) : null}
            {canRequestCancel ? (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onOpenChange(false);
                  onRequestCancelSession(session._id);
                }}
              >
                <X className="size-4" aria-hidden="true" />
                Solicitar cancelamento
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                className="border-ama-cyan/40"
                onClick={() => {
                  onOpenChange(false);
                  onEditSession(session._id);
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Editar sessão
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onOpenChange(false);
                  onCancelSession(session._id);
                }}
              >
                <X className="size-4" aria-hidden="true" />
                Cancelar sessão
              </Button>
            ) : null}
            {session.status === "AGENDADA" ? (
              <Tooltip content={canComplete ? "" : attendance.completeBlockedReason}>
                <Button
                  type="button"
                  variant="outline"
                  className="border-ama-cyan/40"
                  onClick={() => {
                    onCompleteSession(session._id);
                    onOpenChange(false);
                  }}
                  disabled={!canComplete}
                >
                  <Check className="size-4" aria-hidden="true" />
                  Marcar como realizada
                </Button>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
