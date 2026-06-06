import { getStoredUser } from "../auth/session";
import type { HomeProduct } from "../../types/home";

type HistoryEntry = {
  id: number;
  timestamp: string;
};

const PRODUCT_HISTORY_KEY = "omnimarket.home.produtos.recentes";
const STORE_HISTORY_KEY = "omnimarket.home.lojas.recentes";
const HISTORY_LIMIT = 30;

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function buildScopedKey(baseKey: string) {
  const userEmail = getStoredUser()?.email?.trim().toLowerCase();

  if (!userEmail) {
    return `${baseKey}:visitante`;
  }

  return `${baseKey}:${userEmail}`;
}

function readHistory(baseKey: string) {
  const storage = getStorage();

  if (!storage) {
    return [] as HistoryEntry[];
  }

  const rawValue = storage.getItem(buildScopedKey(baseKey));

  if (!rawValue) {
    return [] as HistoryEntry[];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as HistoryEntry[];

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (entry) => entry && typeof entry.id === "number" && Number.isFinite(entry.id),
        )
      : [];
  } catch {
    return [];
  }
}

function writeHistory(baseKey: string, entries: HistoryEntry[]) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(buildScopedKey(baseKey), JSON.stringify(entries));
}

function registerHistoryEntry(baseKey: string, id?: number | null) {
  if (!id || !Number.isFinite(id) || id <= 0) {
    return;
  }

  const nextEntries = [
    {
      id,
      timestamp: new Date().toISOString(),
    },
    ...readHistory(baseKey).filter((entry) => entry.id !== id),
  ].slice(0, HISTORY_LIMIT);

  writeHistory(baseKey, nextEntries);
}

export function registrarVisualizacaoLoja(lojaId?: number | null) {
  registerHistoryEntry(STORE_HISTORY_KEY, lojaId);
}

export function registrarVisualizacaoProduto(
  produto: Pick<HomeProduct, "id" | "lojaId"> | null | undefined,
) {
  if (!produto) {
    return;
  }

  registerHistoryEntry(PRODUCT_HISTORY_KEY, produto.id);
  registerHistoryEntry(STORE_HISTORY_KEY, produto.lojaId);
}

export function obterIdsProdutosRecentes() {
  return readHistory(PRODUCT_HISTORY_KEY).map((entry) => entry.id);
}

export function obterIdsLojasRecentes() {
  return readHistory(STORE_HISTORY_KEY).map((entry) => entry.id);
}
