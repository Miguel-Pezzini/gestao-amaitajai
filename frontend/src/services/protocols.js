import api, { getOnce } from "./api";

export async function listProtocols(params = {}) {
  const { data } = await getOnce("/protocols", { params });
  return data;
}

export async function listPatientProtocols(patientId) {
  const { data } = await getOnce(`/patients/${patientId}/protocols`);
  return data;
}

export async function createProtocol(payload) {
  const { data } = await api.post("/protocols", payload);
  return data;
}

export async function updateProtocolStatus(protocolId, status) {
  const { data } = await api.patch(`/protocols/${protocolId}/status`, { status });
  return data;
}
