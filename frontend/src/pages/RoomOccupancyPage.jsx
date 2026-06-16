import { useState } from "react";
import { Building2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionDetailDialog } from "@/features/agenda/components/SessionDetailDialog";
import { RoomOccupancyGrid } from "@/features/room-occupancy/components/RoomOccupancyGrid";
import { RoomOccupancyNav } from "@/features/room-occupancy/components/RoomOccupancyNav";
import {
  RoomOccupancyGridSkeleton,
  RoomOccupancyNavSkeleton,
} from "@/features/room-occupancy/components/RoomOccupancySkeleton";
import { useRoomOccupancy } from "@/hooks/useRoomOccupancy";

export function RoomOccupancyPage() {
  const occupancy = useRoomOccupancy();
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);

  function openSessionDetail(session) {
    setSelectedSession(session);
    setSessionDetailOpen(true);
  }

  function closeSessionDetail() {
    setSessionDetailOpen(false);
    setSelectedSession(null);
  }

  const selectedRoom = occupancy.rooms.find((room) => room._id === occupancy.selectedRoomId);
  const hasRooms = occupancy.rooms.length > 0;
  const showEmptyRooms = !occupancy.loading && !occupancy.loadingSessions && !hasRooms;
  const showSkeleton = occupancy.loading || (occupancy.loadingSessions && hasRooms);
  const showGrid = !showSkeleton && hasRooms;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-3">
          <CardTitle className="text-xl text-ama-text">Ocupação das salas</CardTitle>
          <CardDescription>
            Visualize os horários ocupados por sala, de segunda a sexta, das 8h às 18h.
            {selectedRoom ? ` Exibindo: ${selectedRoom.name}.` : ""}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-ama-cyan/30">
        <CardHeader className="space-y-3 p-4 sm:space-y-4 sm:p-6">
          {occupancy.loading ? (
            <RoomOccupancyNavSkeleton />
          ) : showEmptyRooms ? (
            <EmptyState
              icon={Building2}
              title="Nenhuma sala ativa"
              description="Cadastre salas em Cadastros Gerais para visualizar a ocupação."
            />
          ) : (
            <RoomOccupancyNav
              referenceDate={occupancy.referenceDate}
              rooms={occupancy.rooms}
              selectedRoomId={occupancy.selectedRoomId}
              onRoomChange={occupancy.setSelectedRoomId}
              onReferenceDateChange={occupancy.setReferenceDate}
            />
          )}
        </CardHeader>

        {showSkeleton ? <RoomOccupancyGridSkeleton /> : null}

        {showGrid ? (
          <RoomOccupancyGrid
            workWeekDays={occupancy.workWeekDays}
            getDaySessions={occupancy.getDaySessions}
            onOpenSession={openSessionDetail}
          />
        ) : null}
      </Card>

      <SessionDetailDialog
        open={sessionDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSessionDetail();
          }
        }}
        session={selectedSession}
        isAdmin
      />
    </div>
  );
}
