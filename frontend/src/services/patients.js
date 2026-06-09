import api, { getOnce } from "./api";

export async function listPatients(params = {}) {
  const { data } = await getOnce("/patients", { params });
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

export async function getPatientDeactivationImpact(patientId) {
  const { data } = await api.get(`/patients/${patientId}/deactivation-impact`);
  return data;
}

export async function updatePatientStatus(patientId, isActive, options = {}) {
  const { data } = await api.patch(`/patients/${patientId}/status`, {
    isActive,
    replacements: options.replacements,
  });
  return data;
}
