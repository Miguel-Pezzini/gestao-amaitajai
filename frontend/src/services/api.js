import axios from "axios";
import { clearStoredUser, readStoredToken } from "@/lib/auth-session";
import { isBearerAuth } from "@/lib/auth-transport";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized = null;

api.interceptors.request.use((config) => {
  if (!isBearerAuth()) {
    return config;
  }

  const token = readStoredToken();
  if (!token) {
    return config;
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const inflightGetRequests = new Map();
const recentGetResponses = new Map();
const GET_DEDUP_WINDOW_MS = 300;

function buildGetCacheKey(url, params) {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const normalizedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return `${url}?${JSON.stringify(normalizedEntries)}`;
}

export async function getOnce(url, config = {}) {
  const cacheKey = buildGetCacheKey(url, config.params);
  const now = Date.now();

  const inflight = inflightGetRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const recent = recentGetResponses.get(cacheKey);
  if (recent && now - recent.at < GET_DEDUP_WINDOW_MS) {
    return recent.response;
  }

  const request = api
    .get(url, config)
    .then((response) => {
      recentGetResponses.set(cacheKey, { response, at: Date.now() });
      return response;
    })
    .finally(() => {
      inflightGetRequests.delete(cacheKey);
    });

  inflightGetRequests.set(cacheKey, request);
  return request;
}

export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isLoginRequest = url.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      clearStoredUser();
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export default api;
