import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { AgendaCalendarNav } from "@/features/agenda/components/AgendaCalendarNav";
import { AgendaDayView } from "@/features/agenda/components/AgendaDayView";
import { AgendaMonthView } from "@/features/agenda/components/AgendaMonthView";
import { AgendaSessionsListDialog } from "@/features/agenda/components/AgendaSessionsListDialog";
import { AgendaWeekView } from "@/features/agenda/components/AgendaWeekView";
import { SessionDetailDialog } from "@/features/agenda/components/SessionDetailDialog";
import { AGENDA_VIEW_MODES } from "@/features/agenda/constants";
import { formatOverlapGroupTimeLabel } from "@/features/agenda/utils/timeGridLayout";
import {
  groupSessionsByDay,
  navigateReferenceDate,
  sortSessionsByStart,
  toCalendarKey,
} from "@/features/agenda/utils";

const EMPTY_LIST_DIALOG = {
  open: false,
  title: "",
  description: "",
  sessionIds: [],
  referenceDate: null,
};

export function AgendaCalendarView({
  sessions,
  referenceDate,
  setReferenceDate,
  viewMode,
  setViewMode,
  loadingSessions = false,
  onCompleteSession,
  onCancelSession,
  onEditSession,
  onOpenCreate,
  isAdmin,
}) {
  const grouped = groupSessionsByDay(sessions);
  const [listDialog, setListDialog] = useState(EMPTY_LIST_DIALOG);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);

  const dayViewSessions = useMemo(() => {
    const key = toCalendarKey(referenceDate);
    return sortSessionsByStart(grouped[key] ?? []);
  }, [grouped, referenceDate]);

  const listDialogSessions = useMemo(() => {
    if (!listDialog.open || listDialog.sessionIds.length === 0) {
      return [];
    }

    const sessionsById = new Map(sessions.map((item) => [item._id, item]));
    return sortSessionsByStart(
      listDialog.sessionIds.map((id) => sessionsById.get(id)).filter(Boolean),
    );
  }, [listDialog.open, listDialog.sessionIds, sessions]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) {
      return null;
    }

    return sessions.find((item) => item._id === selectedSessionId) ?? null;
  }, [sessions, selectedSessionId]);

  function openSessionsListDialog({ title, description, sessions: items, referenceDate: date }) {
    setListDialog({
      open: true,
      title,
      description,
      sessionIds: sortSessionsByStart(items).map((item) => item._id),
      referenceDate: date,
    });
  }

  function closeSessionsListDialog() {
    setListDialog(EMPTY_LIST_DIALOG);
  }

  function openDayView(date) {
    setReferenceDate(date);
    setViewMode(AGENDA_VIEW_MODES.DAY);
  }

  function openSessionGroupDialog(block, date) {
    const timeLabel = formatOverlapGroupTimeLabel(block);
    const count = block.sessions.length;

    openSessionsListDialog({
      title: `Sessões · ${timeLabel}`,
      description: `${count} sessão(ões) neste horário. Clique em uma sessão para ver todos os detalhes.`,
      sessions: block.sessions,
      referenceDate: date,
    });
  }

  function openSessionDetail(session) {
    closeSessionsListDialog();
    setSelectedSessionId(session._id);
    setSessionDetailOpen(true);
  }

  function closeSessionDetail() {
    setSessionDetailOpen(false);
    setSelectedSessionId(null);
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

  const showHeaderCreate =
    isAdmin &&
    onOpenCreate &&
    (viewMode === AGENDA_VIEW_MODES.MONTH || viewMode === AGENDA_VIEW_MODES.WEEK);

  return (
    <Card className="border-ama-cyan/30">
      <CardHeader className="space-y-3 p-4 sm:space-y-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <AgendaCalendarNav
              referenceDate={referenceDate}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onNavigate={handleNavigate}
              onGoToToday={handleGoToToday}
            />
          </div>

          {showHeaderCreate ? (
            <Button
              type="button"
              size="sm"
              className="shrink-0 self-start bg-ama-blue text-white hover:bg-ama-blue-dark sm:self-center"
              onClick={() => onOpenCreate(referenceDate)}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova sessão
            </Button>
          ) : null}
        </div>
      </CardHeader>

      {loadingSessions ? (
        <p className="px-4 pb-6 text-sm text-muted-foreground sm:px-6">
          Carregando sessões...
        </p>
      ) : null}

      {!loadingSessions && viewMode === AGENDA_VIEW_MODES.MONTH ? (
        <AgendaMonthView
          referenceDate={referenceDate}
          grouped={grouped}
          onOpenDay={openDayView}
        />
      ) : null}

      {!loadingSessions && viewMode === AGENDA_VIEW_MODES.WEEK ? (
        <AgendaWeekView
          referenceDate={referenceDate}
          grouped={grouped}
          onOpenDay={openDayView}
          onOpenSession={openSessionDetail}
          onOpenSessionGroup={openSessionGroupDialog}
        />
      ) : null}

      {!loadingSessions && viewMode === AGENDA_VIEW_MODES.DAY ? (
        <AgendaDayView
          referenceDate={referenceDate}
          sessions={dayViewSessions}
          isAdmin={isAdmin}
          onOpenSession={openSessionDetail}
          onOpenSessionGroup={openSessionGroupDialog}
          onCompleteSession={onCompleteSession}
          onCancelSession={onCancelSession}
          onOpenCreate={onOpenCreate}
        />
      ) : null}

      <AgendaSessionsListDialog
        open={listDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            closeSessionsListDialog();
            return;
          }
          setListDialog((current) => ({ ...current, open: true }));
        }}
        title={listDialog.title}
        description={listDialog.description}
        sessions={listDialogSessions}
        referenceDate={listDialog.referenceDate}
        onOpenSession={openSessionDetail}
        onCompleteSession={onCompleteSession}
        onCancelSession={onCancelSession}
        isAdmin={isAdmin}
        onOpenCreate={onOpenCreate}
      />

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
        onEditSession={onEditSession}
      />
    </Card>
  );
}
