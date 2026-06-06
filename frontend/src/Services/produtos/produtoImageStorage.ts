const PRODUTO_IMAGE_STORAGE_PREFIX = "omnimarket.produto-imagem";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getProdutoImageStorageKey(produtoId: number) {
  return `${PRODUTO_IMAGE_STORAGE_PREFIX}.${produtoId}`;
}

export function getStoredProdutoImage(produtoId?: number | null) {
  if (!produtoId) {
    return null;
  }

  return getStorage()?.getItem(getProdutoImageStorageKey(produtoId)) ?? null;
}

export function saveStoredProdutoImage(produtoId: number, imageUrl: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(getProdutoImageStorageKey(produtoId), imageUrl);
}

export function removeStoredProdutoImage(produtoId?: number | null) {
  const storage = getStorage();

  if (!storage || !produtoId) {
    return;
  }

  storage.removeItem(getProdutoImageStorageKey(produtoId));
}
