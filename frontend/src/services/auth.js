import api, { getOnce } from "./api";

/**
 * Autenticação via cookie httpOnly (JWT definido pelo backend).
 * O token não fica exposto no JavaScript do navegador.
 */
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function getSession() {
  const { data } = await getOnce("/auth/me");
  return data;
}
