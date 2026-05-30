import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AgendaSessionCard } from "@/features/agenda/components/AgendaSessionCard";

export function AgendaSessionsListDialog({
  open,
  onOpenChange,
  title,
  description,
  sessions,
  onOpenSession,
  onCompleteSession,
  onCancelSession,
  isAdmin,
  referenceDate,
  onOpenCreate,
}) {
  const showCreate = isAdmin && onOpenCreate && referenceDate;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      headerAction={
        showCreate ? (
          <Button
            type="button"
            size="sm"
            className="bg-ama-blue text-white hover:bg-ama-blue-dark"
            onClick={() => {
              onOpenChange(false);
              onOpenCreate(referenceDate);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova sessão
          </Button>
        ) : null
      }
      className="sm:max-w-2xl"
    >
      {sessions.length === 0 ? (
        showCreate ? (
          <div className="rounded-lg border border-dashed border-ama-cyan/30 bg-ama-light/30 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 border-ama-cyan/40"
              onClick={() => {
                onOpenChange(false);
                onOpenCreate(referenceDate);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Agendar sessão
            </Button>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
        )
      ) : (
        <ul className="divide-y divide-ama-cyan/15 overflow-hidden rounded-lg border border-ama-cyan/20 bg-white">
          {sessions.map((session) => (
            <AgendaSessionCard
              key={session._id}
              session={session}
              onOpenSession={onOpenSession}
              onCompleteSession={onCompleteSession}
              onCancelSession={onCancelSession}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      )}
    </Dialog>
  );
}
