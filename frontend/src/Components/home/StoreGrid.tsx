import { LoaderCircle, Store } from "lucide-react";
import type { HomeStore } from "../../types/home";
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
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <LoaderCircle className="h-4 w-4 animate-spin text-yellow-400" />
          <span>Carregando lojas...</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: Math.min(limite, 4) }).map((_, indice) => (
            <div
              key={`skeleton-loja-${indice}`}
              className="min-h-[220px] rounded-[28px] border border-white/10 bg-white/[0.03]"
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
    <div className="grid gap-4 lg:grid-cols-2">
      {lojas.slice(0, limite).map((loja) => (
        <StoreCard key={loja.id} loja={loja} />
      ))}
    </div>
  );
}
