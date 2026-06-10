import api, { getOnce } from "./api";

export async function listFundingSources() {
  const { data } = await getOnce("/funding-sources");
  return data;
}

export async function createFundingSource(payload) {
  const { data } = await api.post("/funding-sources", payload);
  return data;
}

export async function updateFundingSource(fundingSourceId, payload) {
  const { data } = await api.patch(`/funding-sources/${fundingSourceId}`, payload);
  return data;
}

export async function updateFundingSourceStatus(fundingSourceId, isActive) {
  const { data } = await api.patch(`/funding-sources/${fundingSourceId}/status`, { isActive });
  return data;
}
