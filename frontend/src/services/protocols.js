import api, { getOnce } from "./api";

export async function listProtocolTypes() {
  const { data } = await getOnce("/protocol-types");
  return data;
}

export async function createProtocolType(payload) {
  const { data } = await api.post("/protocol-types", payload);
  return data;
}

export async function updateProtocolType(protocolTypeId, payload) {
  const { data } = await api.patch(`/protocol-types/${protocolTypeId}`, payload);
  return data;
}

export async function updateProtocolTypeStatus(protocolTypeId, isActive) {
  const { data } = await api.patch(`/protocol-types/${protocolTypeId}/status`, { isActive });
  return data;
}

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

export async function updateProtocolStatus(protocolId, status, { cancelReason } = {}) {
  const { data } = await api.patch(`/protocols/${protocolId}/status`, {
    status,
    ...(cancelReason !== undefined ? { cancelReason } : {}),
  });
  return data;
}
