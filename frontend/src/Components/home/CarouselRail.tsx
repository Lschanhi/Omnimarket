import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type CarouselRailProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scrollMode?: "item" | "page";
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  pauseAutoplayOnHover?: boolean;
};

export function CarouselRail({
  ariaLabel,
  children,
  className = "",
  contentClassName = "",
  scrollMode = "item",
  autoplay = false,
  autoplayIntervalMs = 4500,
  pauseAutoplayOnHover = true,
}: CarouselRailProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const autoplayIndexRef = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  const obterGap = useCallback((viewport: HTMLDivElement) => {
    const style = window.getComputedStyle(viewport);
    const gap = style.columnGap || style.gap || "0";
    return Number.parseFloat(gap) || 0;
  }, []);

  const obterDistanciaScroll = useCallback((viewport: HTMLDivElement) => {
    if (scrollMode === "page") {
      return Math.max(viewport.clientWidth * 0.92, 280);
    }

    const primeiroItem = viewport.firstElementChild;

    if (!(primeiroItem instanceof HTMLElement)) {
      return Math.max(viewport.clientWidth * 0.92, 280);
    }

    return primeiroItem.getBoundingClientRect().width + obterGap(viewport);
  }, [obterGap, scrollMode]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return undefined;
    }

    function syncScrollState() {
      if (!viewportRef.current) {
        return;
      }

      const viewport = viewportRef.current;
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      setHasOverflow(maxScrollLeft > 8);
      setCanScrollLeft(viewport.scrollLeft > 8);
      setCanScrollRight(viewport.scrollLeft < maxScrollLeft - 8);

      const distanciaScroll = obterDistanciaScroll(viewport);
      autoplayIndexRef.current =
        distanciaScroll > 0 ? Math.round(viewport.scrollLeft / distanciaScroll) : 0;
    }

    syncScrollState();
    viewport.addEventListener("scroll", syncScrollState, { passive: true });
    window.addEventListener("resize", syncScrollState);

    return () => {
      viewport.removeEventListener("scroll", syncScrollState);
      window.removeEventListener("resize", syncScrollState);
    };
  }, [children, obterDistanciaScroll]);

  function scrollByDirection(direction: "left" | "right") {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const distance = obterDistanciaScroll(viewport);
    viewport.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (!autoplay || autoplayPaused || !hasOverflow || typeof window === "undefined") {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const distanciaScroll = obterDistanciaScroll(viewport);
      if (distanciaScroll <= 0) {
        return;
      }

      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      const maxIndex = Math.max(0, Math.round(maxScrollLeft / distanciaScroll));
      const proximoIndice =
        autoplayIndexRef.current >= maxIndex ? 0 : autoplayIndexRef.current + 1;
      const destino = Math.min(proximoIndice * distanciaScroll, maxScrollLeft);

      viewport.scrollTo({
        left: destino,
        behavior: "smooth",
      });

      autoplayIndexRef.current = proximoIndice;
    }, autoplayIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoplay, autoplayIntervalMs, autoplayPaused, hasOverflow, obterDistanciaScroll]);

  return (
    <div
      className={`space-y-4 ${className}`.trim()}
      onMouseEnter={() => {
        if (pauseAutoplayOnHover) {
          setAutoplayPaused(true);
        }
      }}
      onMouseLeave={() => {
        if (pauseAutoplayOnHover) {
          setAutoplayPaused(false);
        }
      }}
      onFocusCapture={() => setAutoplayPaused(true)}
      onBlurCapture={() => setAutoplayPaused(false)}
    >
      {hasOverflow ? (
        <div className="hidden items-center justify-end gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByDirection("left")}
            disabled={!canScrollLeft}
            aria-label="Voltar carrossel"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:border-yellow-400/40 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => scrollByDirection("right")}
            disabled={!canScrollRight}
            aria-label="Avancar carrossel"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:border-yellow-400/40 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        aria-label={ariaLabel}
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
