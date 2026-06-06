const LOJA_AVATAR_STORAGE_PREFIX = "omnimarket.loja-avatar";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getLojaAvatarStorageKey(lojaId: number) {
  return `${LOJA_AVATAR_STORAGE_PREFIX}.${lojaId}`;
}

export function getStoredLojaAvatar(lojaId?: number | null) {
  if (!lojaId) {
    return null;
  }

  return getStorage()?.getItem(getLojaAvatarStorageKey(lojaId)) ?? null;
}

export function saveStoredLojaAvatar(lojaId: number, avatarUrl: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(getLojaAvatarStorageKey(lojaId), avatarUrl);
}

export function removeStoredLojaAvatar(lojaId?: number | null) {
  const storage = getStorage();

  if (!storage || !lojaId) {
    return;
  }

  storage.removeItem(getLojaAvatarStorageKey(lojaId));
}
