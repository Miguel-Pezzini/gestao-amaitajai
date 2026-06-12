import api, { getOnce } from "./api";

export async function listSessionAttendance(sessionId) {
  const { data } = await getOnce(`/agenda/sessions/${sessionId}/attendance`);
  return data;
}

export async function upsertSessionAttendance(sessionId, patientId, payload) {
  const { data } = await api.put(`/agenda/sessions/${sessionId}/attendance/${patientId}`, payload);
  return data;
}
