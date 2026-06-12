const AUTH_TRANSPORT_COOKIE = "cookie";
const AUTH_TRANSPORT_BEARER = "bearer";

export function getAuthTransport() {
  const raw = String(import.meta.env.VITE_AUTH_TRANSPORT ?? AUTH_TRANSPORT_COOKIE)
    .trim()
    .toLowerCase();

  if (raw === AUTH_TRANSPORT_BEARER) {
    return AUTH_TRANSPORT_BEARER;
  }

  return AUTH_TRANSPORT_COOKIE;
}

export function isBearerAuth() {
  return getAuthTransport() === AUTH_TRANSPORT_BEARER;
}
