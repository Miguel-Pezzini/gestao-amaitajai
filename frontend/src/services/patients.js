import api from "./api";

export async function listPatients(params = {}) {
  const { data } = await api.get("/patients", { params });
  return data;
}

export async function createPatient(payload) {
  const { data } = await api.post("/patients", payload);
  return data;
}

export async function updatePatient(patientId, payload) {
  const { data } = await api.patch(`/patients/${patientId}`, payload);
  return data;
}

export async function updatePatientStatus(patientId, isActive) {
  const { data } = await api.patch(`/patients/${patientId}/status`, { isActive });
  return data;
}
