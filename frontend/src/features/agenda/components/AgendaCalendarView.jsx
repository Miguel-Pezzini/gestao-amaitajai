import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { AgendaCalendarNav } from "@/features/agenda/components/AgendaCalendarNav";
import { AgendaDayView } from "@/features/agenda/components/AgendaDayView";
import { AgendaMonthView } from "@/features/agenda/components/AgendaMonthView";
import { AgendaSessionCard } from "@/features/agenda/components/AgendaSessionCard";
import { AgendaWeekView } from "@/features/agenda/components/AgendaWeekView";
import { SessionDetailDialog } from "@/features/agenda/components/SessionDetailDialog";
import { AGENDA_VIEW_MODES } from "@/features/agenda/constants";
import {
  formatDayFull,
  groupSessionsByDay,
  navigateReferenceDate,
  sortSessionsByStart,
  toCalendarKey,
} from "@/features/agenda/utils";

export function AgendaCalendarView({
  sessions,
  referenceDate,
  setReferenceDate,
  onCompleteSession,
  onCancelSession,
  onOpenCreate,
  isAdmin,
}) {
  const [viewMode, setViewMode] = useState(AGENDA_VIEW_MODES.MONTH);
  const grouped = groupSessionsByDay(sessions);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);

  const dayViewSessions = useMemo(() => {
    const key = toCalendarKey(referenceDate);
    return sortSessionsByStart(grouped[key] ?? []);
  }, [grouped, referenceDate]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) {
      return [];
    }
    const key = toCalendarKey(selectedDay);
    return sortSessionsByStart(grouped[key] ?? []);
  }, [grouped, selectedDay]);

  function openDayDialog(date) {
    setSelectedDay(date);
    setDayDialogOpen(true);
  }

  function openSessionDetail(session) {
    setSelectedSession(session);
    setSessionDetailOpen(true);
  }

  function closeSessionDetail() {
    setSessionDetailOpen(false);
    setSelectedSession(null);
  }

  function handleNavigate(direction) {
    setReferenceDate((current) => navigateReferenceDate(current, viewMode, direction));
  }

  function handleGoToToday() {
    setReferenceDate(new Date());
  }

  function handleViewModeChange(nextMode) {
    setViewMode(nextMode);
    if (nextMode === AGENDA_VIEW_MODES.DAY) {
      setReferenceDate(new Date());
    }
  }

  return (
    <Card className="border-ama-cyan/30">
      <CardHeader className="space-y-3 p-4 sm:space-y-4 sm:p-6">
        <AgendaCalendarNav
          referenceDate={referenceDate}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onNavigate={handleNavigate}
          onGoToToday={handleGoToToday}
        />
      </CardHeader>

      {viewMode === AGENDA_VIEW_MODES.MONTH ? (
        <AgendaMonthView
          referenceDate={referenceDate}
          grouped={grouped}
          onOpenDay={openDayDialog}
        />
      ) : null}

      {viewMode === AGENDA_VIEW_MODES.WEEK ? (
        <AgendaWeekView
          referenceDate={referenceDate}
          grouped={grouped}
          onOpenDay={openDayDialog}
        />
      ) : null}

      {viewMode === AGENDA_VIEW_MODES.DAY ? (
        <AgendaDayView
          referenceDate={referenceDate}
          sessions={dayViewSessions}
          isAdmin={isAdmin}
          onOpenSession={openSessionDetail}
          onCompleteSession={onCompleteSession}
          onCancelSession={onCancelSession}
          onOpenCreate={onOpenCreate}
        />
      ) : null}

      <Dialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        title={selectedDay ? formatDayFull(selectedDay) : "Sessões do dia"}
        description={
          selectedDayItems.length > 0
            ? `${selectedDayItems.length} sessão(ões) neste dia. Clique em uma sessão para ver todos os detalhes.`
            : "Nenhuma sessão agendada para este dia."
        }
        headerAction={
          isAdmin ? (
            <Button
              type="button"
              size="sm"
              className="bg-ama-blue text-white hover:bg-ama-blue-dark"
              onClick={() => {
                setDayDialogOpen(false);
                onOpenCreate(selectedDay);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova sessão
            </Button>
          ) : null
        }
        className="sm:max-w-2xl"
      >
        {selectedDayItems.length === 0 ? (
          isAdmin ? (
            <div className="rounded-lg border border-dashed border-ama-cyan/30 bg-ama-light/30 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 border-ama-cyan/40"
                onClick={() => {
                  setDayDialogOpen(false);
                  onOpenCreate(selectedDay);
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
            {selectedDayItems.map((session) => (
              <AgendaSessionCard
                key={session._id}
                session={session}
                onOpenSession={openSessionDetail}
                onCompleteSession={onCompleteSession}
                onCancelSession={onCancelSession}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </Dialog>

      <SessionDetailDialog
        open={sessionDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSessionDetail();
            return;
          }
          setSessionDetailOpen(true);
        }}
        session={selectedSession}
        isAdmin={isAdmin}
        onCompleteSession={onCompleteSession}
        onCancelSession={onCancelSession}
      />
    </Card>
  );
}
