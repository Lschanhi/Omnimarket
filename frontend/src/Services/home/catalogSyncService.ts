import { limparCacheLojaPublica } from "../user/lojaPublicaService";

export const CATALOGO_ATUALIZADO_STORAGE_KEY = "omnimarket.catalogo.updatedAt";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function notificarCatalogoAtualizado(lojaId?: number | null) {
  const updatedAt = Date.now();
  const storage = getStorage();

  limparCacheLojaPublica(lojaId);
  storage?.setItem(CATALOGO_ATUALIZADO_STORAGE_KEY, String(updatedAt));
}
