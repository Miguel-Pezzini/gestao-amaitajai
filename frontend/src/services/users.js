import api, { getOnce } from "./api";

export async function listUsers(params = {}) {
  const { data } = await getOnce("/users", { params });
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post("/users", payload);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await api.patch(`/users/${userId}`, payload);
  return data;
}

export async function updateUserStatus(userId, accountStatus) {
  const { data } = await api.patch(`/users/${userId}/status`, { accountStatus });
  return data;
}
