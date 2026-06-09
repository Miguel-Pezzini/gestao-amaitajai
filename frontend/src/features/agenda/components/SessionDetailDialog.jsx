import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SESSION_FORMAT_LABELS } from "@/features/cadastros/constants";
import { SessionParticipantsDetail } from "@/features/agenda/components/SessionParticipants";
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
}) {
  if (!session) {
    return null;
  }

  const canComplete = session.status === "agendada";
  const canCancel = isAdmin && session.status !== "cancelada";
  const hasActions = canComplete || canCancel;
  const notes = String(session.notes ?? "").trim();
  const cancelReason = String(session.cancelReason ?? "").trim();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      nested
      title={sessionSummary(session)}
      description={formatSessionDateTime(session.startAt)}
      className="sm:max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusBadgeClass(session.status)}>
            {getSessionStatusLabel(session.status)}
          </Badge>
          <Badge variant="outline" className="border-ama-cyan/40 text-ama-blue-dark">
            {getSessionFormatLabel(session.modality)}
          </Badge>
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

        {session.status === "cancelada" && cancelReason ? (
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
          <div className="flex flex-col gap-2 border-t border-ama-cyan/15 pt-4 sm:flex-row sm:justify-end">
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
            {canComplete ? (
              <Button
                type="button"
                variant="outline"
                className="border-ama-cyan/40"
                onClick={() => {
                  onCompleteSession(session._id);
                  onOpenChange(false);
                }}
              >
                <Check className="size-4" aria-hidden="true" />
                Marcar como realizada
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
