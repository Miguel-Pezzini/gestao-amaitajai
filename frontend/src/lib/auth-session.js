const STORAGE_KEY = "ama-auth-user";
const TOKEN_STORAGE_KEY = "ama-access-token";

export function normalizeAuthUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id ?? user._id ?? null,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus ?? "ATIVO",
  };
}

export function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeAuthUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function persistUser(user) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistToken(token) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function clearStoredUser() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted environments.
  }
  clearStoredToken();
}
