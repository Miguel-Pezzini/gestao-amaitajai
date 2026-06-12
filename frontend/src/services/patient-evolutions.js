import api, { getOnce } from "./api";

export async function listSessionEvolutions(sessionId) {
  const { data } = await getOnce(`/agenda/sessions/${sessionId}/evolutions`);
  return data;
}

export async function upsertSessionEvolution(sessionId, patientId, content) {
  const { data } = await api.put(`/agenda/sessions/${sessionId}/evolutions/${patientId}`, {
    content,
  });
  return data;
}

export async function listPatientEvolutions(patientId, params = {}) {
  const { data } = await getOnce(`/patients/${patientId}/evolutions`, { params });
  return data;
}
