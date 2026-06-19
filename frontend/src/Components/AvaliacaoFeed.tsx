import Stars from "./RatingStar/Stars";
import type { ProdutoAvaliacaoLeitura } from "../types/avaliacao";

type AvaliacaoFeedProps = {
  titulo: string;
  descricao: string;
  avaliacoes: ProdutoAvaliacaoLeitura[];
  contexto: "produto" | "loja";
  isLoading?: boolean;
  mensagemVazia: string;
  erro?: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

function formatarData(valor?: string | null) {
  if (!valor) {
    return "";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return dateFormatter.format(data);
}

function formatarRotuloSecundario(avaliacao: ProdutoAvaliacaoLeitura, contexto: "produto" | "loja") {
  if (contexto === "produto") {
    return `Loja ${avaliacao.nomeLoja} - nota da loja ${avaliacao.notaLoja}/5`;
  }

  return `Produto ${avaliacao.nomeProduto} - nota do produto ${avaliacao.notaProduto}/5`;
}

export function AvaliacaoFeed({
  titulo,
  descricao,
  avaliacoes,
  contexto,
  isLoading = false,
  mensagemVazia,
  erro = "",
}: AvaliacaoFeedProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">{titulo}</h2>
        <p className="text-sm leading-6 text-neutral-400">{descricao}</p>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-sm text-neutral-300">
          Carregando avaliacoes...
        </div>
      ) : avaliacoes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-sm text-neutral-300">
          {erro || mensagemVazia}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {avaliacoes.map((avaliacao) => {
            const notaPrincipal =
              contexto === "produto" ? avaliacao.notaProduto : avaliacao.notaLoja;

            return (
              <article
                key={avaliacao.id}
                className="rounded-3xl border border-white/10 bg-black/30 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{avaliacao.nomeComprador}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">
                      {formatarRotuloSecundario(avaliacao, contexto)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {avaliacao.compraVerificada ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-100">
                        Compra verificada
                      </span>
                    ) : null}

                    {avaliacao.recomendaProduto ? (
                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-yellow-100">
                        Recomenda
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Stars nota={notaPrincipal} className="text-sm" />
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {formatarData(avaliacao.dtAtualizacao ?? avaliacao.dtCriacao)}
                  </span>
                </div>

                {avaliacao.titulo ? (
                  <p className="mt-4 text-base font-semibold text-white">{avaliacao.titulo}</p>
                ) : null}

                {avaliacao.comentario ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-300">
                    {avaliacao.comentario}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
