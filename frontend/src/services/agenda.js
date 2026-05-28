import api from "./api";

export async function listRooms() {
  const { data } = await api.get("/agenda/rooms");
  return data;
}

export async function searchAgendaPatients(params = {}) {
  const { data } = await api.get("/agenda/lookups/patients", { params });
  return data;
}

export async function searchAgendaProfessionals(params = {}) {
  const { data } = await api.get("/agenda/lookups/professionals", { params });
  return data;
}

export async function createRoom(payload) {
  const { data } = await api.post("/agenda/rooms", payload);
  return data;
}

export async function updateRoom(roomId, payload) {
  const { data } = await api.patch(`/agenda/rooms/${roomId}`, payload);
  return data;
}

export async function updateRoomStatus(roomId, isActive) {
  const { data } = await api.patch(`/agenda/rooms/${roomId}/status`, { isActive });
  return data;
}

export async function listSessionTypes() {
  const { data } = await api.get("/agenda/session-types");
  return data;
}

export async function createSessionType(payload) {
  const { data } = await api.post("/agenda/session-types", payload);
  return data;
}

export async function updateSessionType(sessionTypeId, payload) {
  const { data } = await api.patch(`/agenda/session-types/${sessionTypeId}`, payload);
  return data;
}

export async function updateSessionTypeStatus(sessionTypeId, isActive) {
  const { data } = await api.patch(`/agenda/session-types/${sessionTypeId}/status`, {
    isActive,
  });
  return data;
}

export async function listSessionModalities() {
  const { data } = await api.get("/agenda/session-modalities");
  return data;
}

export async function updateSessionModality(modality, payload) {
  const { data } = await api.patch(`/agenda/session-modalities/${modality}`, payload);
  return data;
}

export async function listSessions(params = {}) {
  const { data } = await api.get("/agenda/sessions", { params });
  return data;
}

export async function createSession(payload) {
  const { data } = await api.post("/agenda/sessions", payload);
  return data;
}

export async function updateSession(sessionId, payload) {
  const { data } = await api.patch(`/agenda/sessions/${sessionId}`, payload);
  return data;
}

export async function cancelSession(sessionId, cancelReason) {
  const { data } = await api.patch(`/agenda/sessions/${sessionId}/cancel`, {
    cancelReason,
  });
  return data;
}

export async function completeSession(sessionId) {
  const { data } = await api.patch(`/agenda/sessions/${sessionId}/complete`);
  return data;
}
