import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { HomeStore } from "../../types/home";
import { StoreIdentityBadge } from "../produto/StoreIdentityBadge";

type StoreCardProps = {
  loja: HomeStore;
};

export function StoreCard({ loja }: StoreCardProps) {
  const localizacao = [loja.cidade?.trim(), loja.uf?.trim()].filter(Boolean).join(" / ");

  return (
    <Link to="/loja/$id" params={{ id: String(loja.id) }}>
      <article className="group flex h-full flex-col justify-between rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-yellow-400/30">
        <div className="space-y-4">
          <StoreIdentityBadge nome={loja.nome} avatarUrl={loja.avatarUrl} />

          {loja.descricao?.trim() ? (
            <p className="line-clamp-3 text-sm leading-6 text-neutral-300">{loja.descricao}</p>
          ) : (
            <p className="text-sm leading-6 text-neutral-400">
              Vitrine com {loja.totalProdutos} produto(s) publicada(s) no marketplace.
            </p>
          )}
        </div>

        <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm text-neutral-400">
          <div className="flex items-center justify-between gap-3">
            <span>Produtos ativos</span>
            <span className="font-semibold text-white">{loja.totalProdutos}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Avaliacao
            </span>
            <span className="font-semibold text-white">
              {loja.mediaAvaliacao.toFixed(1)} ({loja.totalAvaliacoes})
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>Localizacao</span>
            <span className="font-semibold text-white">
              {localizacao || "Disponivel online"}
            </span>
          </div>

          {loja.categorias.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {loja.categorias.slice(0, 3).map((categoria) => (
                <span
                  key={`${loja.id}-${categoria}`}
                  className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200"
                >
                  {categoria}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
