import { formatProtocolDate } from "@/features/protocols/utils";

export function ProtocolStatusDates({ protocol }) {
  return (
    <div className="space-y-0.5">
      <p>
        <span className="text-foreground/80">Aberto em:</span>{" "}
        {formatProtocolDate(protocol.createdAt)}
      </p>
      {protocol.status === "CONCLUIDO" && protocol.completedAt ? (
        <p>
          <span className="text-foreground/80">Concluído em:</span>{" "}
          {formatProtocolDate(protocol.completedAt)}
        </p>
      ) : null}
      {protocol.status === "CANCELADO" && protocol.cancelledAt ? (
        <p>
          <span className="text-foreground/80">Cancelado em:</span>{" "}
          {formatProtocolDate(protocol.cancelledAt)}
        </p>
      ) : null}
      {protocol.status === "CANCELADO" && protocol.cancelReason ? (
        <p className="break-words">
          <span className="text-foreground/80">Justificativa:</span> {protocol.cancelReason}
        </p>
      ) : null}
    </div>
  );
}
