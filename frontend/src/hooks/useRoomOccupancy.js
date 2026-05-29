import { useCallback, useEffect, useMemo, useState } from "react";
import { listRooms, listSessions } from "@/services/agenda";
import { useToast } from "@/contexts/toast-context";
import { pickDefaultCatalogId } from "@/features/agenda/constants";
import { sortSessionsByStart, toCalendarKey } from "@/features/agenda/utils";
import {
  buildWorkWeekDays,
  filterOccupancySessions,
  getWorkWeekQueryRange,
  groupSessionsByCalendarDay,
} from "@/features/room-occupancy/utils";
import { getApiErrorMessage } from "@/lib/api-error";

export function useRoomOccupancy() {
  const toast = useToast();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const workWeekDays = useMemo(
    () => buildWorkWeekDays(referenceDate),
    [referenceDate],
  );

  const roomSessions = useMemo(
    () => sortSessionsByStart(filterOccupancySessions(sessions, selectedRoomId)),
    [sessions, selectedRoomId],
  );

  const sessionsByDay = useMemo(
    () => groupSessionsByCalendarDay(roomSessions),
    [roomSessions],
  );

  const loadRooms = useCallback(async () => {
    const response = await listRooms();
    const items = (response.items ?? []).filter((room) => room.isActive !== false);
    setRooms(items);
    setSelectedRoomId((current) => current || pickDefaultCatalogId(items));
    return items;
  }, []);

  const loadSessions = useCallback(
    async (date, options = {}) => {
      const { showLoading = true } = options;
      if (showLoading) {
        setLoadingSessions(true);
      }

      try {
        const range = getWorkWeekQueryRange(date);
        const response = await listSessions(range);
        setSessions(response.items ?? []);
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, "Não foi possível carregar a ocupação das salas."),
        );
      } finally {
        if (showLoading) {
          setLoadingSessions(false);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        await loadRooms();
      } catch (err) {
        if (mounted) {
          toast.error(getApiErrorMessage(err, "Não foi possível carregar as salas."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadRooms, toast]);

  useEffect(() => {
    loadSessions(referenceDate);
  }, [referenceDate, loadSessions]);

  function getDaySessions(day) {
    const key = toCalendarKey(day);
    return sortSessionsByStart(sessionsByDay[key] ?? []);
  }

  return {
    referenceDate,
    setReferenceDate,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    workWeekDays,
    roomSessions,
    getDaySessions,
    loading,
    loadingSessions,
    reloadSessions: () => loadSessions(referenceDate, { showLoading: false }),
  };
}
