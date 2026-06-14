import { useState } from "react";
import {
  CalendarDays,
  CircleAlert,
  Download,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import { ProdutoImagem } from "../../../Components/produto/ProdutoImagem";
import type {
  CriarSolicitacaoCancelamentoPayload,
  MotivoSolicitacaoCancelamentoApi,
  SolicitacaoCancelamentoLeituraApiResponse,
  StatusSolicitacaoCancelamentoApi,
  TipoSolicitacaoPedidoApi,
} from "../../../Services/pedidos/pedidoService";
import type { PerfilPedidoDetalhe } from "../../../types/perfil";

type ModalPedidoCompraProps = {
  descricao: string;
  isOpen: boolean;
  isCarregandoPedido?: boolean;
  isCarregandoSolicitacoes?: boolean;
  isConfirmandoRecebimento?: boolean;
  isBaixandoRecibo?: boolean;
  isProcessandoSolicitacao?: boolean;
  isCancelandoPedido?: boolean;
  pedido: PerfilPedidoDetalhe | null;
  solicitacoesCancelamento: SolicitacaoCancelamentoLeituraApiResponse[];
  onClose: () => void;
  onBaixarRecibo: (pedido: PerfilPedidoDetalhe) => void;
  onCancelarPedido: (pedido: PerfilPedidoDetalhe) => void;
  onConfirmarRecebimento: (pedido: PerfilPedidoDetalhe) => void;
  onCriarSolicitacaoCancelamento: (
    pedido: PerfilPedidoDetalhe,
    dados: Pick<
      CriarSolicitacaoCancelamentoPayload,
      "tipoSolicitacao" | "motivo" | "observacao"
    >,
  ) => void;
  onCancelarSolicitacaoCancelamento: (
    solicitacao: SolicitacaoCancelamentoLeituraApiResponse,
  ) => void;
};

const MOTIVOS_SOLICITACAO_CANCELAMENTO: Array<{
  value: MotivoSolicitacaoCancelamentoApi;
  label: string;
}> = [
  { value: "Arrependimento", label: "Arrependimento" },
  { value: "AtrasoEntrega", label: "Atraso na entrega" },
  { value: "ProdutoComDefeito", label: "Produto com defeito" },
  { value: "ProdutoIncorreto", label: "Produto incorreto" },
  { value: "EntregaNaoRecebida", label: "Entrega nao recebida" },
  { value: "Outro", label: "Outro motivo" },
];

const TIPOS_SOLICITACAO_OPTIONS: Array<{
  value: TipoSolicitacaoPedidoApi;
  label: string;
  descricao: string;
}> = [
  {
    value: "Cancelamento",
    label: "Cancelamento",
    descricao: "Use depois do envio, quando a compra nao puder mais ser cancelada direto.",
  },
  {
    value: "ProblemaEntrega",
    label: "Problema de entrega",
    descricao: "Ideal para atraso, extravio ou entrega ainda nao recebida.",
  },
  {
    value: "Devolucao",
    label: "Devolucao",
    descricao: "Use depois da entrega para arrependimento ou retorno do produto.",
  },
  {
    value: "Troca",
    label: "Troca",
    descricao: "Use depois da entrega quando o item precisar ser substituido.",
  },
];

const MOTIVOS_POR_TIPO: Record<
  TipoSolicitacaoPedidoApi,
  MotivoSolicitacaoCancelamentoApi[]
> = {
  Cancelamento: ["Arrependimento", "Outro"],
  ProblemaEntrega: ["AtrasoEntrega", "EntregaNaoRecebida", "Outro"],
  Devolucao: ["Arrependimento", "ProdutoComDefeito", "ProdutoIncorreto", "Outro"],
  Troca: ["ProdutoComDefeito", "ProdutoIncorreto", "Outro"],
};

const STATUS_SOLICITACAO_TONE: Record<StatusSolicitacaoCancelamentoApi, string> = {
  Aberta: "border-yellow-400/20 bg-yellow-400/10 text-yellow-100",
  EmAnalise: "border-blue-400/20 bg-blue-400/10 text-blue-100",
  Aprovada: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Recusada: "border-red-400/20 bg-red-400/10 text-red-100",
  Cancelada: "border-white/10 bg-white/5 text-neutral-200",
  Concluida: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatarDataHora(valor?: string | null) {
  if (!valor) {
    return "";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return dateTimeFormatter.format(data);
}

function formatarMotivoSolicitacao(motivo: MotivoSolicitacaoCancelamentoApi) {
  return (
    MOTIVOS_SOLICITACAO_CANCELAMENTO.find((option) => option.value === motivo)?.label ?? motivo
  );
}

function formatarStatusSolicitacao(status: StatusSolicitacaoCancelamentoApi) {
  switch (status) {
    case "EmAnalise":
      return "Em analise";
    case "Aprovada":
      return "Aprovada";
    case "Recusada":
      return "Recusada";
    case "Cancelada":
      return "Cancelada";
    case "Concluida":
      return "Concluida";
    case "Aberta":
    default:
      return "Aberta";
  }
}

function formatarTipoSolicitacao(tipo: TipoSolicitacaoPedidoApi) {
  switch (tipo) {
    case "ProblemaEntrega":
      return "Problema de entrega";
    case "Devolucao":
      return "Devolucao";
    case "Troca":
      return "Troca";
    case "Cancelamento":
    default:
      return "Cancelamento";
  }
}

function obterTipoSolicitacaoInicial(pedido: PerfilPedidoDetalhe | null): TipoSolicitacaoPedidoApi {
  if (!pedido) {
    return "Cancelamento";
  }

  if (pedido.statusFluxoKey === "finalizado") {
    return "Devolucao";
  }

  if (pedido.statusFluxoKey === "enviado") {
    return "ProblemaEntrega";
  }

  return "Cancelamento";
}

function obterMotivosDisponiveis(tipoSolicitacao: TipoSolicitacaoPedidoApi) {
  const motivosPermitidos = new Set(MOTIVOS_POR_TIPO[tipoSolicitacao]);

  return MOTIVOS_SOLICITACAO_CANCELAMENTO.filter((option) => motivosPermitidos.has(option.value));
}

function criarMensagemBloqueioRecebimento(pedido: PerfilPedidoDetalhe | null) {
  if (!pedido || pedido.podeConfirmarRecebimento) {
    return "";
  }

  if (pedido.possuiSolicitacaoCancelamentoAtiva) {
    return "Existe uma solicitacao ativa para este pedido. Resolva a tratativa antes de confirmar o recebimento.";
  }

  if (pedido.statusFluxoKey === "finalizado") {
    return "O recebimento deste pedido ja foi confirmado.";
  }

  if (pedido.statusFluxoKey === "cancelado") {
    return "Pedidos cancelados nao podem ter o recebimento confirmado.";
  }

  return "A confirmacao fica disponivel quando o pedido estiver enviado.";
}

function criarMensagemBloqueioCancelamentoDireto(pedido: PerfilPedidoDetalhe | null) {
  if (!pedido || pedido.podeCancelar) {
    return "";
  }

  if (pedido.statusFluxoKey === "cancelado") {
    return "Este pedido ja foi cancelado.";
  }

  if (pedido.statusFluxoKey === "enviado" || pedido.statusFluxoKey === "finalizado") {
    return "Depois do envio, o cancelamento direto sai de cena e a tratativa passa a ser feita por solicitacao.";
  }

  return "O cancelamento direto fica disponivel enquanto o pedido ainda nao tiver sido enviado.";
}

function criarMensagemBloqueioSolicitacao(
  pedido: PerfilPedidoDetalhe | null,
  solicitacaoAtiva: SolicitacaoCancelamentoLeituraApiResponse | null,
  tipoSolicitacao: TipoSolicitacaoPedidoApi,
) {
  if (!pedido) {
    return "";
  }

  if (pedido.pedidoMultiloja) {
    return "Este pedido possui itens de mais de uma loja. A API exige a venda especifica (`vendaId`) para abrir a solicitacao, mas esse vinculo ainda nao vem no DTO de compra.";
  }

  if (solicitacaoAtiva || pedido.possuiSolicitacaoCancelamentoAtiva) {
    return "Ja existe uma solicitacao ativa para este pedido. Aguarde a analise ou cancele a solicitacao atual antes de abrir outra.";
  }

  if (pedido.statusFluxoKey === "cancelado") {
    return "Pedidos cancelados nao aceitam novas tratativas.";
  }

  switch (tipoSolicitacao) {
    case "Cancelamento":
      if (pedido.statusFluxoKey !== "enviado") {
        return "O cancelamento por solicitacao fica disponivel apenas depois que o pedido ja foi enviado e antes da confirmacao da entrega.";
      }

      return "";

    case "ProblemaEntrega":
      if (pedido.statusFluxoKey !== "enviado") {
        return "Problemas de entrega podem ser abertos quando o pedido estiver enviado e ainda nao tiver sido confirmado como entregue.";
      }

      return "";

    case "Devolucao":
    case "Troca":
      if (pedido.statusFluxoKey !== "finalizado") {
        return `${tipoSolicitacao === "Troca" ? "A troca" : "A devolucao"} fica disponivel somente depois que o pedido for entregue.`;
      }

      return "";

    default:
      return "";
  }
}

export function ModalPedidoCompra({
  descricao,
  isOpen,
  isCarregandoPedido = false,
  isCarregandoSolicitacoes = false,
  isConfirmandoRecebimento = false,
  isBaixandoRecibo = false,
  isProcessandoSolicitacao = false,
  isCancelandoPedido = false,
  pedido,
  solicitacoesCancelamento,
  onClose,
  onBaixarRecibo,
  onCancelarPedido,
  onConfirmarRecebimento,
  onCriarSolicitacaoCancelamento,
  onCancelarSolicitacaoCancelamento,
}: ModalPedidoCompraProps) {
  const tipoSolicitacaoInicial = obterTipoSolicitacaoInicial(pedido);
  const motivoSolicitacaoInicial =
    obterMotivosDisponiveis(tipoSolicitacaoInicial)[0]?.value ?? "Outro";
  const [mostrarOpcoesProblema, setMostrarOpcoesProblema] = useState(false);
  const [tipoSolicitacao, setTipoSolicitacao] =
    useState<TipoSolicitacaoPedidoApi>(tipoSolicitacaoInicial);
  const [motivoSolicitacao, setMotivoSolicitacao] =
    useState<MotivoSolicitacaoCancelamentoApi>(motivoSolicitacaoInicial);
  const [observacaoSolicitacao, setObservacaoSolicitacao] = useState("");

  const solicitacaoAtiva =
    solicitacoesCancelamento.find((solicitacao) =>
      ["Aberta", "EmAnalise", "Aprovada"].includes(solicitacao.status),
    ) ?? null;
  const motivosDisponiveis = obterMotivosDisponiveis(tipoSolicitacao);
  const mensagemBloqueioRecebimento = criarMensagemBloqueioRecebimento(pedido);
  const mensagemBloqueioCancelamentoDireto = criarMensagemBloqueioCancelamentoDireto(pedido);
  const mensagemBloqueioSolicitacao = criarMensagemBloqueioSolicitacao(
    pedido,
    solicitacaoAtiva,
    tipoSolicitacao,
  );
  const isBloqueandoAcoes =
    isConfirmandoRecebimento ||
    isProcessandoSolicitacao ||
    isCancelandoPedido ||
    isBaixandoRecibo;
  const cancelamentoDiretoDisponivel = Boolean(pedido?.podeCancelar);
  const podeConfirmarRecebimento =
    Boolean(pedido?.podeConfirmarRecebimento) && !isBloqueandoAcoes;
  const podeBaixarRecibo = Boolean(pedido) && !isBloqueandoAcoes;
  const podeCriarSolicitacao =
    Boolean(pedido) &&
    !mensagemBloqueioSolicitacao &&
    !isConfirmandoRecebimento &&
    !isProcessandoSolicitacao &&
    !isCancelandoPedido;

  function handleTipoSolicitacaoChange(tipo: TipoSolicitacaoPedidoApi) {
    const proximosMotivos = obterMotivosDisponiveis(tipo);

    setTipoSolicitacao(tipo);
    setMotivoSolicitacao(proximosMotivos[0]?.value ?? "Outro");
  }

  function handleCriarSolicitacao() {
    if (!pedido || !podeCriarSolicitacao) {
      return;
    }

    onCriarSolicitacaoCancelamento(pedido, {
      tipoSolicitacao,
      motivo: motivoSolicitacao,
      observacao: observacaoSolicitacao,
    });
  }

  function handleFecharModal() {
    setMostrarOpcoesProblema(false);
    setObservacaoSolicitacao("");
    onClose();
  }

  return (
    <ProfileModal
      isOpen={isOpen}
      title={pedido ? `Detalhes do pedido #${pedido.pedidoId}` : "Detalhes do pedido"}
      description={descricao}
      onClose={handleFecharModal}
    >
      {pedido ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Status</p>
              <p className="mt-2 text-sm font-semibold text-white">{pedido.status}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
                <CalendarDays className="h-4 w-4" />
                <span>Data</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{pedido.dataPedido}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Total</p>
              <p className="mt-2 text-sm font-semibold text-yellow-300">{pedido.total}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-yellow-300" />
              <h3 className="text-sm font-semibold text-white">Itens do pedido</h3>
            </div>

            <div className="mt-4 space-y-3">
              {pedido.itens.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-3 sm:grid-cols-[96px_minmax(0,1fr)]"
                >
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <ProdutoImagem
                      src={item.imagemUrl}
                      sources={item.imagens}
                      alt={item.nomeProduto}
                      placeholderLabel={item.nomeProduto}
                      className="h-24 w-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white">{item.nomeProduto}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                          {item.nomeLoja}
                        </p>
                      </div>

                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-200">
                        {item.quantidade}x
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-neutral-300">{item.descricao}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="text-neutral-400">Unitario: {item.precoUnitario}</span>
                      <span className="font-semibold text-yellow-300">{item.valorTotal}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-yellow-300" />
                <h3 className="text-sm font-semibold text-white">Entrega</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <p>
                  <span className="text-neutral-500">Tipo:</span> {pedido.tipoEntrega}
                </p>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                  <p>{pedido.enderecoEntrega}</p>
                </div>
                <p>
                  <span className="text-neutral-500">Observacao:</span> {pedido.observacao}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-yellow-300" />
                <h3 className="text-sm font-semibold text-white">Resumo financeiro</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Subtotal</span>
                  <span>{pedido.subtotal}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Frete</span>
                  <span>{pedido.frete}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <span className="font-medium text-white">Total</span>
                  <span className="font-semibold text-yellow-300">{pedido.total}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">Acompanhamento do pedido</p>
                  <p className="mt-1 text-sm text-neutral-300">
                    O painel usa as regras atuais do backend para cancelar pedidos antes do envio,
                    confirmar o recebimento e abrir tratativas de cancelamento, devolucao, troca
                    ou problema de entrega.
                  </p>
                </div>

                {isCarregandoPedido ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                    Atualizando detalhes e permissoes deste pedido...
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="space-y-3">
                      <Botao
                        type="button"
                        onClick={() => onConfirmarRecebimento(pedido)}
                        icon={<PackageCheck className="h-4 w-4" />}
                        disabled={!podeConfirmarRecebimento}
                        className="h-auto min-h-[52px] px-4 py-3 text-center leading-tight sm:px-4"
                      >
                        <span className="text-center leading-tight">
                          {isConfirmandoRecebimento ? "Confirmando..." : "Confirmar recebimento"}
                        </span>
                      </Botao>

                      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                        {mensagemBloqueioRecebimento ||
                          "Use esta confirmacao quando o pedido realmente chegar ao destino."}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Botao
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (cancelamentoDiretoDisponivel) {
                            onCancelarPedido(pedido);
                            return;
                          }

                          setMostrarOpcoesProblema((currentState) => !currentState);
                        }}
                        icon={<CircleAlert className="h-4 w-4" />}
                        disabled={
                          isConfirmandoRecebimento ||
                          isProcessandoSolicitacao ||
                          isCancelandoPedido
                        }
                        className="h-auto min-h-[52px] px-4 py-3 text-center leading-tight sm:px-4"
                      >
                        <span className="text-center leading-tight">
                          {cancelamentoDiretoDisponivel
                            ? isCancelandoPedido
                              ? "Cancelando..."
                              : "Cancelar pedido"
                            : "Problemas, devolucao e troca"}
                        </span>
                      </Botao>

                      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                        {cancelamentoDiretoDisponivel
                          ? "Enquanto o pedido ainda nao foi enviado, o cancelamento pode ser feito direto pelo painel."
                          : mensagemBloqueioCancelamentoDireto ||
                            "Abra uma tratativa para a loja analisar cancelamento, devolucao, troca ou problema de entrega."}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Botao
                        type="button"
                        variant="secondary"
                        onClick={() => onBaixarRecibo(pedido)}
                        icon={<Download className="h-4 w-4" />}
                        disabled={!podeBaixarRecibo}
                        className="h-auto min-h-[52px] px-4 py-3 text-center leading-tight sm:px-4"
                      >
                        <span className="text-center leading-tight">
                          {isBaixandoRecibo ? "Baixando..." : "Baixar recibo"}
                        </span>
                      </Botao>

                      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                        Baixe um arquivo imprimivel com os itens, entrega e totais desta compra.
                      </div>
                    </div>
                  </div>
                )}

                {mostrarOpcoesProblema ? (
                  <div className="space-y-4 border-t border-white/10 pt-3">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Abrir tratativa do pedido
                        </p>
                        <p className="mt-1 text-sm text-neutral-300">
                          Escolha o tipo da solicitacao, registre o motivo e adicione um contexto
                          curto para facilitar a analise da loja.
                        </p>
                      </div>

                      {mensagemBloqueioSolicitacao ? (
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                          {mensagemBloqueioSolicitacao}
                        </div>
                      ) : null}

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor="tipoSolicitacaoPedido"
                              className="text-sm text-neutral-300"
                            >
                              Tipo da solicitacao
                            </label>
                            <select
                              id="tipoSolicitacaoPedido"
                              value={tipoSolicitacao}
                              onChange={(event) =>
                                handleTipoSolicitacaoChange(
                                  event.target.value as TipoSolicitacaoPedidoApi,
                                )
                              }
                              disabled={isProcessandoSolicitacao}
                              className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {TIPOS_SOLICITACAO_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-neutral-500">
                              {TIPOS_SOLICITACAO_OPTIONS.find(
                                (option) => option.value === tipoSolicitacao,
                              )?.descricao ?? ""}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label htmlFor="motivoSolicitacao" className="text-sm text-neutral-300">
                              Motivo
                            </label>
                            <select
                              id="motivoSolicitacao"
                              value={motivoSolicitacao}
                              onChange={(event) =>
                                setMotivoSolicitacao(
                                  event.target.value as MotivoSolicitacaoCancelamentoApi,
                                )
                              }
                              disabled={!podeCriarSolicitacao}
                              className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {motivosDisponiveis.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor="observacaoSolicitacao"
                              className="text-sm text-neutral-300"
                            >
                              Observacao
                            </label>
                            <textarea
                              id="observacaoSolicitacao"
                              rows={4}
                              maxLength={500}
                              value={observacaoSolicitacao}
                              onChange={(event) => setObservacaoSolicitacao(event.target.value)}
                              disabled={!podeCriarSolicitacao}
                              placeholder="Descreva o contexto em ate 500 caracteres."
                              className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white placeholder-[#6b6b6b] outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>

                          <Botao
                            type="button"
                            variant="secondary"
                            onClick={handleCriarSolicitacao}
                            icon={<XCircle className="h-4 w-4" />}
                            disabled={!podeCriarSolicitacao}
                            className="border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/20 sm:px-4"
                          >
                            {isProcessandoSolicitacao
                              ? "Abrindo solicitacao..."
                              : `Solicitar ${formatarTipoSolicitacao(tipoSolicitacao).toLowerCase()}`}
                          </Botao>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <p className="text-sm font-semibold text-white">Resumo do fluxo</p>
                          <div className="mt-3 space-y-3 text-sm text-neutral-300">
                            <p>
                              <span className="text-neutral-500">Tipo:</span>{" "}
                              {formatarTipoSolicitacao(tipoSolicitacao)}
                            </p>
                            <p>
                              <span className="text-neutral-500">Motivos sugeridos:</span>{" "}
                              {motivosDisponiveis
                                .map((motivo) => formatarMotivoSolicitacao(motivo.value))
                                .join(", ")}
                            </p>
                            <p>
                              <span className="text-neutral-500">Proximo passo:</span> a loja
                              recebe a tratativa, pode colocar em analise e decide se aprova,
                              recusa ou conclui o caso.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Historico das solicitacoes</p>
                        <p className="mt-1 text-sm text-neutral-300">
                          Consulte o andamento das tratativas abertas para este pedido.
                        </p>
                      </div>

                      {isCarregandoSolicitacoes ? (
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                          Carregando historico das solicitacoes...
                        </div>
                      ) : solicitacoesCancelamento.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                          Nenhuma solicitacao foi aberta para este pedido ate o momento.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {solicitacoesCancelamento.map((solicitacao) => (
                            <article
                              key={solicitacao.id}
                              className="rounded-2xl border border-white/10 bg-black/30 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-white">
                                    Solicitacao #{solicitacao.id}
                                  </p>
                                  <p className="text-sm text-neutral-300">
                                    Loja: {solicitacao.nomeLoja}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_SOLICITACAO_TONE[solicitacao.status]}`}
                                >
                                  {formatarStatusSolicitacao(solicitacao.status)}
                                </span>
                              </div>

                              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                                <p>
                                  <span className="text-neutral-500">Tipo:</span>{" "}
                                  {formatarTipoSolicitacao(solicitacao.tipoSolicitacao)}
                                </p>
                                <p>
                                  <span className="text-neutral-500">Motivo:</span>{" "}
                                  {formatarMotivoSolicitacao(solicitacao.motivo)}
                                </p>
                                <p>
                                  <span className="text-neutral-500">Criada em:</span>{" "}
                                  {formatarDataHora(solicitacao.dataCriacao)}
                                </p>
                                {solicitacao.observacao ? (
                                  <p>
                                    <span className="text-neutral-500">Observacao:</span>{" "}
                                    {solicitacao.observacao}
                                  </p>
                                ) : null}
                                {solicitacao.observacaoAnalise ? (
                                  <p>
                                    <span className="text-neutral-500">Analise da loja:</span>{" "}
                                    {solicitacao.observacaoAnalise}
                                  </p>
                                ) : null}
                                {solicitacao.dataConclusao ? (
                                  <p>
                                    <span className="text-neutral-500">Concluida em:</span>{" "}
                                    {formatarDataHora(solicitacao.dataConclusao)}
                                  </p>
                                ) : null}
                              </div>

                              {solicitacao.podeCancelarPeloSolicitante ? (
                                <div className="mt-4">
                                  <Botao
                                    type="button"
                                    variant="secondary"
                                    onClick={() => onCancelarSolicitacaoCancelamento(solicitacao)}
                                    disabled={isProcessandoSolicitacao}
                                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 sm:w-auto sm:px-5"
                                  >
                                    {isProcessandoSolicitacao
                                      ? "Cancelando..."
                                      : "Cancelar solicitacao"}
                                  </Botao>
                                </div>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Botao
              type="button"
              variant="secondary"
              onClick={handleFecharModal}
              className="sm:w-auto sm:px-6"
            >
              Fechar
            </Botao>
          </div>
        </div>
      ) : null}
    </ProfileModal>
  );
}
