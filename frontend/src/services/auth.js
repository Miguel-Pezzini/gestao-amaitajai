import { isBearerAuth } from "@/lib/auth-transport";
import { persistToken } from "@/lib/auth-session";
import api, { getOnce } from "./api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

/**
 * Autenticação via cookie httpOnly (padrão) ou Bearer + localStorage (modo bearer).
 */
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  if (isBearerAuth() && data?.token) {
    persistToken(data.token);
  }
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

export async function getAuthConfig() {
  const { data } = await getOnce("/auth/config");
  return data;
}

export function getGoogleLoginUrl() {
  return `${API_BASE}/auth/google`;
}
