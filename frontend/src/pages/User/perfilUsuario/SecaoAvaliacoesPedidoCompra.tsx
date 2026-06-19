import { useState } from "react";
import { CheckCircle2, MessageSquareText, Star } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import Stars from "../../../Components/RatingStar/Stars";
import type { ProdutoAvaliacaoAtualizacaoPayload } from "../../../types/avaliacao";
import type { PerfilPedidoDetalhe, PerfilPedidoItem } from "../../../types/perfil";

type SecaoAvaliacoesPedidoCompraProps = {
  pedido: PerfilPedidoDetalhe;
  isCarregandoPedido?: boolean;
  isSalvandoAvaliacao?: boolean;
  produtoIdAvaliacaoEmProcesso?: number | null;
  onSalvarAvaliacao: (
    pedido: PerfilPedidoDetalhe,
    item: PerfilPedidoItem,
    dados: ProdutoAvaliacaoAtualizacaoPayload,
  ) => void;
};

type AvaliacaoFormularioState = {
  notaProduto: number;
  notaLoja: number;
  titulo: string;
  comentario: string;
  recomendaProduto: boolean;
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

function criarFormularioAvaliacao(item: PerfilPedidoItem): AvaliacaoFormularioState {
  return {
    notaProduto: item.avaliacaoAtual?.notaProduto ?? 5,
    notaLoja: item.avaliacaoAtual?.notaLoja ?? 5,
    titulo: item.avaliacaoAtual?.titulo ?? "",
    comentario: item.avaliacaoAtual?.comentario ?? "",
    recomendaProduto: item.avaliacaoAtual?.recomendaProduto ?? true,
  };
}

function StarRatingInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (nota: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-sm text-neutral-400">{value}/5</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((nota) => {
          const ativo = nota <= value;

          return (
            <button
              key={`${label}-${nota}`}
              type="button"
              onClick={() => onChange(nota)}
              disabled={disabled}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                ativo
                  ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                  : "border-white/10 bg-black/30 text-neutral-500 hover:border-yellow-400/20 hover:text-yellow-200"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              aria-label={`${label} ${nota} de 5`}
            >
              <Star className={`h-5 w-5 ${ativo ? "fill-current" : ""}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SecaoAvaliacoesPedidoCompra({
  pedido,
  isCarregandoPedido = false,
  isSalvandoAvaliacao = false,
  produtoIdAvaliacaoEmProcesso = null,
  onSalvarAvaliacao,
}: SecaoAvaliacoesPedidoCompraProps) {
  const temItensAvaliaveis =
    pedido.statusFluxoKey === "finalizado" || pedido.itens.some((item) => item.avaliacaoAtual);

  const [formularios, setFormularios] = useState<Record<number, AvaliacaoFormularioState>>(() =>
    pedido.itens.reduce<Record<number, AvaliacaoFormularioState>>(
      (acumulador, item) => {
        acumulador[item.id] = criarFormularioAvaliacao(item);
        return acumulador;
      },
      {},
    ),
  );
  const [itemExpandidoId, setItemExpandidoId] = useState<number | null>(
    () => pedido.itens.find((item) => !item.avaliacaoAtual)?.id ?? pedido.itens[0]?.id ?? null,
  );

  if (!temItensAvaliaveis) {
    return null;
  }

  const totalAvaliado = pedido.itens.filter((item) => item.avaliacaoAtual).length;

  function atualizarFormulario(
    itemId: number,
    campo: keyof AvaliacaoFormularioState,
    valor: AvaliacaoFormularioState[keyof AvaliacaoFormularioState],
  ) {
    setFormularios((estadoAtual) => ({
      ...estadoAtual,
      [itemId]: {
        ...estadoAtual[itemId],
        [campo]: valor,
      },
    }));
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
      <div className="flex items-start gap-3">
        <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-white">Avaliacoes da compra</p>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-emerald-100">
                {totalAvaliado}/{pedido.itens.length} item(ns) avaliados
              </span>
            </div>

            <p className="text-sm text-neutral-200">
              Avalie cada item entregue com nota para o produto e para a loja. Se quiser, voce
              tambem pode editar uma avaliacao que ja foi enviada.
            </p>
          </div>

          {isCarregandoPedido ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
              Carregando as avaliacoes vinculadas a este pedido...
            </div>
          ) : (
            <div className="space-y-3">
              {pedido.itens.map((item) => {
                const formulario = formularios[item.id] ?? criarFormularioAvaliacao(item);
                const avaliacaoAtual = item.avaliacaoAtual ?? null;
                const itemExpandido = itemExpandidoId === item.id;
                const itemEmProcesso =
                  isSalvandoAvaliacao && produtoIdAvaliacaoEmProcesso === item.produtoId;
                const acaoBloqueada =
                  isSalvandoAvaliacao && produtoIdAvaliacaoEmProcesso !== item.produtoId;

                return (
                  <article
                    key={`avaliacao-item-${item.id}`}
                    className="rounded-3xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-base font-semibold text-white">{item.nomeProduto}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                            {item.nomeLoja}
                          </p>
                        </div>

                        {avaliacaoAtual ? (
                          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
                            <Stars nota={avaliacaoAtual.notaProduto} mostrarNota={false} />
                            <span>Produto {avaliacaoAtual.notaProduto}/5</span>
                            <span>Loja {avaliacaoAtual.notaLoja}/5</span>
                            <span>
                              Atualizada em{" "}
                              {formatarData(
                                avaliacaoAtual.dtAtualizacao ?? avaliacaoAtual.dtCriacao,
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                            <span>Item pronto para receber sua avaliacao.</span>
                          </div>
                        )}
                      </div>

                      <Botao
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setItemExpandidoId((atual) => (atual === item.id ? null : item.id))
                        }
                        disabled={acaoBloqueada}
                        className="sm:w-auto sm:px-5"
                      >
                        {avaliacaoAtual
                          ? itemExpandido
                            ? "Fechar edicao"
                            : "Editar avaliacao"
                          : itemExpandido
                            ? "Ocultar formulario"
                            : "Avaliar item"}
                      </Botao>
                    </div>

                    {itemExpandido ? (
                      <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <StarRatingInput
                              label="Nota do produto"
                              value={formulario.notaProduto}
                              disabled={acaoBloqueada || itemEmProcesso}
                              onChange={(nota) => atualizarFormulario(item.id, "notaProduto", nota)}
                            />
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <StarRatingInput
                              label="Nota da loja"
                              value={formulario.notaLoja}
                              disabled={acaoBloqueada || itemEmProcesso}
                              onChange={(nota) => atualizarFormulario(item.id, "notaLoja", nota)}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor={`avaliacao-titulo-${item.id}`}
                              className="text-sm text-neutral-300"
                            >
                              Titulo
                            </label>
                            <input
                              id={`avaliacao-titulo-${item.id}`}
                              type="text"
                              maxLength={120}
                              value={formulario.titulo}
                              onChange={(event) =>
                                atualizarFormulario(item.id, "titulo", event.target.value)
                              }
                              disabled={acaoBloqueada || itemEmProcesso}
                              placeholder="Resuma sua experiencia em poucas palavras."
                              className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white placeholder-[#6b6b6b] outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>

                          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-200">
                            <input
                              type="checkbox"
                              checked={formulario.recomendaProduto}
                              onChange={(event) =>
                                atualizarFormulario(
                                  item.id,
                                  "recomendaProduto",
                                  event.target.checked,
                                )
                              }
                              disabled={acaoBloqueada || itemEmProcesso}
                              className="h-4 w-4 rounded border-white/20 bg-black text-yellow-400"
                            />
                            Recomendo este produto para outros compradores.
                          </label>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={`avaliacao-comentario-${item.id}`}
                            className="text-sm text-neutral-300"
                          >
                            Comentario
                          </label>
                          <textarea
                            id={`avaliacao-comentario-${item.id}`}
                            rows={4}
                            maxLength={1200}
                            value={formulario.comentario}
                            onChange={(event) =>
                              atualizarFormulario(item.id, "comentario", event.target.value)
                            }
                            disabled={acaoBloqueada || itemEmProcesso}
                            placeholder="Conte como foi a entrega, a qualidade e o atendimento."
                            className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white placeholder-[#6b6b6b] outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                            Cada avaliacao usa 1 a 5 estrelas para produto e loja.
                          </p>

                          <Botao
                            type="button"
                            onClick={() =>
                              onSalvarAvaliacao(pedido, item, {
                                notaProduto: formulario.notaProduto,
                                notaLoja: formulario.notaLoja,
                                titulo: formulario.titulo.trim() || undefined,
                                comentario: formulario.comentario.trim() || undefined,
                                recomendaProduto: formulario.recomendaProduto,
                              })
                            }
                            disabled={
                              acaoBloqueada ||
                              itemEmProcesso ||
                              formulario.notaProduto < 1 ||
                              formulario.notaLoja < 1
                            }
                            className="sm:w-auto sm:px-6"
                          >
                            {itemEmProcesso
                              ? avaliacaoAtual
                                ? "Salvando..."
                                : "Enviando..."
                              : avaliacaoAtual
                                ? "Salvar avaliacao"
                                : "Enviar avaliacao"}
                          </Botao>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
