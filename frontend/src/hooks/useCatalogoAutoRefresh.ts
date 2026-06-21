import { useEffect, useRef } from "react";
import { CATALOGO_ATUALIZADO_STORAGE_KEY } from "../Services/home/catalogSyncService";

type UseCatalogoAutoRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
  minIntervalBetweenRefreshesMs?: number;
  onRefresh: () => void | Promise<void>;
};

export function useCatalogoAutoRefresh({
  enabled = true,
  intervalMs = 15000,
  minIntervalBetweenRefreshesMs = 4000,
  onRefresh,
}: UseCatalogoAutoRefreshOptions) {
  const onRefreshRef = useRef(onRefresh);
  const lastRefreshAtRef = useRef<number | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    if (lastRefreshAtRef.current === null) {
      lastRefreshAtRef.current = Date.now();
    }

    const executarRefresh = () => {
      const agora = Date.now();
      const ultimoRefresh = lastRefreshAtRef.current;

      if (ultimoRefresh !== null && agora - ultimoRefresh < minIntervalBetweenRefreshesMs) {
        return;
      }

      lastRefreshAtRef.current = agora;
      void Promise.resolve(onRefreshRef.current()).catch(() => undefined);
    };

    const handleWindowFocus = () => {
      executarRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        executarRefresh();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CATALOGO_ATUALIZADO_STORAGE_KEY) {
        executarRefresh();
      }
    };

    const intervalId =
      intervalMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState !== "hidden") {
              executarRefresh();
            }
          }, intervalMs)
        : null;

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs, minIntervalBetweenRefreshesMs]);
}
