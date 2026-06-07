import { LoaderCircle, Store } from "lucide-react";
import type { HomeStore } from "../../types/home";
import { CarouselRail } from "./CarouselRail";
import { StoreCard } from "./StoreCard";

type StoreGridProps = {
  lojas: HomeStore[];
  isLoading?: boolean;
  limite?: number;
  mensagemVazia: string;
};

export function StoreGrid({
  lojas,
  isLoading = false,
  limite = 10,
  mensagemVazia,
}: StoreGridProps) {
  const itemClassName =
    "w-[min(41vw,158px)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] 2xl:w-[calc((100%-5rem)/6)]";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <LoaderCircle className="h-4 w-4 animate-spin text-yellow-400" />
          <span>Carregando lojas...</span>
        </div>

        <div className="flex gap-5 overflow-hidden pb-2">
          {Array.from({ length: Math.min(limite, 4) }).map((_, indice) => (
            <div
              key={`skeleton-loja-${indice}`}
              className={`h-[220px] shrink-0 rounded-[30px] border border-white/10 bg-white/[0.03] ${itemClassName}`.trim()}
            />
          ))}
        </div>
      </div>
    );
  }

  if (lojas.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-300">
            <Store className="h-6 w-6" />
          </span>

          <p className="text-sm leading-6 text-neutral-400">{mensagemVazia}</p>
        </div>
      </div>
    );
  }

  return (
    <CarouselRail ariaLabel="Carrossel de lojas" contentClassName="gap-5">
      {lojas.slice(0, limite).map((loja) => (
        <div key={loja.id} className={`shrink-0 snap-start ${itemClassName}`.trim()}>
          <StoreCard loja={loja} />
        </div>
      ))}
    </CarouselRail>
  );
}
