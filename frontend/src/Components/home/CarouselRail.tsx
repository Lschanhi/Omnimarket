import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type CarouselRailProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CarouselRail({
  ariaLabel,
  children,
  className = "",
  contentClassName = "",
}: CarouselRailProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

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
    }

    syncScrollState();
    viewport.addEventListener("scroll", syncScrollState, { passive: true });
    window.addEventListener("resize", syncScrollState);

    return () => {
      viewport.removeEventListener("scroll", syncScrollState);
      window.removeEventListener("resize", syncScrollState);
    };
  }, [children]);

  function scrollByDirection(direction: "left" | "right") {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const distance = Math.max(viewport.clientWidth * 0.82, 280);
    viewport.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  return (
    <div className={`space-y-4 ${className}`.trim()}>
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
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
