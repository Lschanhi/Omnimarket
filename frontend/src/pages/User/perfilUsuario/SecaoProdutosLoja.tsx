import { Trash2, X } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import type { CategoriaLojaOption, LojaFeedbackState } from "./tipos";
import { criarMensagemConfirmacaoExclusaoCategoria } from "./utilitarios";

type SecaoProdutosLojaProps = {
  categoriaLojaAtiva: string;
  categoriaLojaModoExclusao: boolean;
  categoriaLojaPendenteExclusao: CategoriaLojaOption | null;
  categoriaLojaRemovendoId: string | null;
  categoriasDaLoja: CategoriaLojaOption[];
  lojaFeedback: LojaFeedbackState | null;
  onAlternarModoExclusaoCategorias: () => void;
  onCancelarModoExclusaoCategorias: () => void;
  onConfirmarRemocaoCategoria: () => void;
  onLimparCategoriaPendenteExclusao: () => void;
  onSelecionarCategoria: (categoriaId: string) => void;
  onSolicitarRemocaoCategoriaLoja: (categoria: CategoriaLojaOption) => void;
};

export function SecaoProdutosLoja({
  categoriaLojaAtiva,
  categoriaLojaModoExclusao,
  categoriaLojaPendenteExclusao,
  categoriaLojaRemovendoId,
  categoriasDaLoja,
  lojaFeedback,
  onAlternarModoExclusaoCategorias,
  onCancelarModoExclusaoCategorias,
  onConfirmarRemocaoCategoria,
  onLimparCategoriaPendenteExclusao,
  onSelecionarCategoria,
  onSolicitarRemocaoCategoriaLoja,
}: SecaoProdutosLojaProps) {
  return (
    <div className="space-y-3">
      {lojaFeedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            lojaFeedback.tone === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/20 bg-red-500/10 text-red-200"
          }`.trim()}
        >
          {lojaFeedback.message}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Categorias da loja</p>
          <p className="text-xs text-neutral-400">
            Filtre os produtos pelas categorias já cadastradas na sua vitrine.
          </p>
        </div>
      </div>

      {categoriaLojaModoExclusao ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Clique no <span className="font-semibold text-red-200">X</span> da categoria que deseja
          excluir da vitrine.
        </div>
      ) : null}

      {categoriaLojaPendenteExclusao ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          <p className="font-medium text-red-200">Confirmar exclusão da categoria</p>
          <p className="mt-2">
            {criarMensagemConfirmacaoExclusaoCategoria(categoriaLojaPendenteExclusao)}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Botao
              type="button"
              variant="secondary"
              disabled={Boolean(categoriaLojaRemovendoId)}
              onClick={onLimparCategoriaPendenteExclusao}
              className="h-11 sm:w-auto sm:px-6"
            >
              Cancelar
            </Botao>

            <Botao
              type="button"
              disabled={Boolean(categoriaLojaRemovendoId)}
              onClick={onConfirmarRemocaoCategoria}
              className="h-11 border-red-400/20 bg-red-500/80 text-white hover:bg-red-500 sm:w-auto sm:px-6"
              icon={<Trash2 className="h-4 w-4" />}
            >
              {categoriaLojaRemovendoId === categoriaLojaPendenteExclusao.id
                ? "Excluindo categoria..."
                : "Excluir categoria"}
            </Botao>
          </div>
        </div>
      ) : null}

      {categoriasDaLoja.length > 0 ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelecionarCategoria("todas")}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  categoriaLojaAtiva === "todas"
                    ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                    : "border-white/10 bg-black text-neutral-400 hover:border-white/20 hover:text-white"
                }`.trim()}
              >
                Todas
              </button>

              {categoriasDaLoja.map((categoria) => {
                const categoriaAtiva = categoriaLojaAtiva === categoria.id;
                const categoriaRemovendo = categoriaLojaRemovendoId === categoria.id;

                return (
                  <div
                    key={categoria.id}
                    className={`flex items-center overflow-hidden rounded-full border transition ${
                      categoriaAtiva
                        ? "border-yellow-400/40 bg-yellow-400/10"
                        : "border-white/10 bg-black"
                    }`.trim()}
                  >
                    <button
                      type="button"
                      onClick={() => onSelecionarCategoria(categoria.id)}
                      className={`px-3 py-2 text-sm transition ${
                        categoriaAtiva ? "text-yellow-300" : "text-neutral-400 hover:text-white"
                      }`.trim()}
                    >
                      {categoria.nome}{" "}
                      <span className="text-xs text-neutral-500">({categoria.totalProdutos})</span>
                    </button>

                    {categoriaLojaModoExclusao ? (
                      <button
                        type="button"
                        onClick={() => onSolicitarRemocaoCategoriaLoja(categoria)}
                        disabled={categoriaRemovendo}
                        className={`border-l px-3 py-2 transition ${
                          categoriaAtiva
                            ? "border-yellow-400/20 text-red-200 hover:bg-red-400/15"
                            : "border-white/10 text-red-300 hover:bg-red-400/10"
                        } ${categoriaRemovendo ? "cursor-not-allowed opacity-60" : ""}`.trim()}
                        aria-label={`Selecionar exclusao da categoria ${categoria.nome}`}
                        title={`Selecionar exclusao da categoria ${categoria.nome}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={
                categoriaLojaModoExclusao
                  ? onCancelarModoExclusaoCategorias
                  : onAlternarModoExclusaoCategorias
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 ${
                categoriaLojaModoExclusao
                  ? "border-red-400/40 bg-red-400/10 text-red-200 hover:border-red-400/60 hover:bg-red-400/15 focus-visible:ring-red-400/50"
                  : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-400/15 focus-visible:ring-yellow-400/60"
              }`.trim()}
              aria-label={
                categoriaLojaModoExclusao
                  ? "Cancelar exclusao de categorias"
                  : "Ativar modo de exclusao de categorias"
              }
              title={
                categoriaLojaModoExclusao
                  ? "Cancelar exclusao de categorias"
                  : "Ativar modo de exclusao de categorias"
              }
            >
              {categoriaLojaModoExclusao ? (
                <X className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          As categorias vão aparecer aqui assim que houver produtos publicados.
        </p>
      )}
    </div>
  );
}
