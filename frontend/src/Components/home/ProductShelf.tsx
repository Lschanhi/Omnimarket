import { LoaderCircle, PackageSearch } from "lucide-react";
import type { HomeProduct } from "../../types/home";
import { CarouselRail } from "./CarouselRail";
import { ProductCard } from "./ProductCard";

type ProductShelfProps = {
  produtos: HomeProduct[];
  isLoading?: boolean;
  limite?: number;
  mensagemVazia: string;
  mostrarResumo?: boolean;
  modo?: "grid" | "carousel";
  autoplay?: boolean;
  pauseAutoplayOnHover?: boolean;
  itemClassName?: string;
};

export function ProductShelf({
  produtos,
  isLoading = false,
  limite = 10,
  mensagemVazia,
  mostrarResumo = false,
  modo = "carousel",
  autoplay = false,
  pauseAutoplayOnHover = true,
  itemClassName = "w-[min(82vw,320px)] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]",
}: ProductShelfProps) {
  if (isLoading) {
    if (modo === "carousel") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <LoaderCircle className="h-4 w-4 animate-spin text-yellow-400" />
            <span>Carregando produtos...</span>
          </div>

          <div className="flex gap-4 overflow-hidden pb-2">
            {Array.from({ length: Math.min(limite, 4) }).map((_, indice) => (
              <div
                key={`skeleton-prateleira-${indice}`}
                className={`shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] ${itemClassName}`.trim()}
              >
                <div className="aspect-[4/3] animate-pulse bg-white/10" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
                  <div className="h-6 w-1/3 animate-pulse rounded-full bg-yellow-400/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <LoaderCircle className="h-4 w-4 animate-spin text-yellow-400" />
          <span>Carregando produtos...</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: Math.min(limite, 6) }).map((_, indice) => (
            <div
              key={`skeleton-prateleira-${indice}`}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
            >
              <div className="aspect-[4/3] animate-pulse bg-white/10" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
                <div className="h-6 w-1/3 animate-pulse rounded-full bg-yellow-400/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-300">
            <PackageSearch className="h-6 w-6" />
          </span>

          <p className="text-sm leading-6 text-neutral-400">{mensagemVazia}</p>
        </div>
      </div>
    );
  }

  const produtosVisiveis = produtos.slice(0, limite);

  return (
    <div className="space-y-5">
      {mostrarResumo ? (
        <p className="text-sm text-neutral-400">
          Exibindo <span className="font-semibold text-white">{produtosVisiveis.length}</span> de{" "}
          <span className="font-semibold text-white">{produtos.length}</span> produtos
        </p>
      ) : null}

      {modo === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {produtosVisiveis.map((produto) => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </div>
      ) : (
        <CarouselRail
          ariaLabel="Carrossel de produtos"
          autoplay={autoplay}
          pauseAutoplayOnHover={pauseAutoplayOnHover}
          scrollMode="item"
        >
          {produtosVisiveis.map((produto) => (
            <div
              key={produto.id}
              className={`shrink-0 snap-start ${itemClassName}`.trim()}
            >
              <ProductCard produto={produto} />
            </div>
          ))}
        </CarouselRail>
      )}
    </div>
  );
}
