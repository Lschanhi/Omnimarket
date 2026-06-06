export type SessionUser = {
  nome: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export type StoredSession = {
  token: string;
  tokenExpiraEm: string;
  usuario: SessionUser;
};

const TOKEN_STORAGE_KEY = "omnimarket.token";
const USER_STORAGE_KEY = "omnimarket.user";
export const AUTH_CHANGED_EVENT = "omnimarket-auth-changed";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function saveSession(session: StoredSession) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(TOKEN_STORAGE_KEY, session.token);
  storage.setItem(USER_STORAGE_KEY, JSON.stringify(session.usuario));
  notifyAuthChange();
}

export function updateStoredUser(usuario: SessionUser) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
  notifyAuthChange();
}

export function clearSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(TOKEN_STORAGE_KEY);
  storage.removeItem(USER_STORAGE_KEY);
  notifyAuthChange();
}

export function getAuthToken() {
  return getStorage()?.getItem(TOKEN_STORAGE_KEY) ?? null;
}

export function getStoredUser(): SessionUser | null {
  const rawUser = getStorage()?.getItem(USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}
