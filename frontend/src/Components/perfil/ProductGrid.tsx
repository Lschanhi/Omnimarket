import type { PerfilGridItem } from "../../types/perfil";
import { ProdutoImagem } from "../produto/ProdutoImagem";

// Renderiza os cards de produtos, vendas ou compras de forma reutilizavel.
interface ProductGridProps {
  itens: PerfilGridItem[];
  onItemClick?: (item: PerfilGridItem) => void;
  clickHint?: string;
}

export function ProductGrid({
  itens,
  onItemClick,
  clickHint = "Clique para editar",
}: ProductGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {itens.map((item) => {
        const content = (
          <>
            <div className="flex h-40 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_60%),linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))]">
              {item.imagemUrl || item.imagens?.length ? (
                <ProdutoImagem
                  src={item.imagemUrl}
                  sources={item.imagens}
                  alt={item.titulo}
                  placeholderLabel={item.titulo}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm uppercase tracking-[0.28em] text-neutral-500">
                  Sem imagem
                </span>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{item.titulo}</h3>
                  <p className="mt-1 text-sm text-neutral-400">{item.subtitulo}</p>
                </div>

                {item.badge ? (
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-yellow-300">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-yellow-400">{item.valor}</p>

                {onItemClick ? (
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    {clickHint}
                  </span>
                ) : null}
              </div>
            </div>
          </>
        );

        if (!onItemClick) {
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/45"
            >
              {content}
            </article>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item)}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/45 text-left transition hover:border-yellow-400/40 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
