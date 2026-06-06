import {
  CalendarDays,
  CheckCheck,
  CircleAlert,
  FileText,
  Mail,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import { ProdutoImagem } from "../../../Components/produto/ProdutoImagem";
import type {
  MotivoSolicitacaoCancelamentoApi,
  SolicitacaoCancelamentoLeituraApiResponse,
  StatusSolicitacaoCancelamentoApi,
} from "../../../Services/pedidos/pedidoService";
import type { PerfilPedidoDetalhe } from "../../../types/perfil";

type StatusVendaOperacionalLoja = "EmSeparacao" | "Pronto" | "Enviada";

type ModalPedidoVendaProps = {
  descricao: string;
  isOpen: boolean;
  isCarregandoPedido?: boolean;
  isCarregandoSolicitacoes?: boolean;
  isAtualizandoPedido?: boolean;
  pedido: PerfilPedidoDetalhe | null;
  solicitacoesCancelamento: SolicitacaoCancelamentoLeituraApiResponse[];
  onAtualizarStatus: (
    pedido: PerfilPedidoDetalhe,
    statusVenda: StatusVendaOperacionalLoja,
  ) => void;
  onCancelarPedido: (pedido: PerfilPedidoDetalhe) => void;
  onClose: () => void;
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

function obterAcaoOperacionalPrimaria(pedido: PerfilPedidoDetalhe | null) {
  if (!pedido) {
    return null;
  }

  if (pedido.podeAceitar) {
    return {
      statusVenda: "EmSeparacao" as const,
      label: "Aceitar pedido",
      descricao: "Confirma o aceite da loja e move a venda para Em separacao.",
    };
  }

  if (pedido.podeMarcarComoPronto) {
    return {
      statusVenda: "Pronto" as const,
      label: "Marcar como pronto",
      descricao: "Indica que os itens ja foram separados e podem seguir para expedicao ou retirada.",
    };
  }

  if (pedido.podeMarcarComoEnviado) {
    return {
      statusVenda: "Enviada" as const,
      label: "Marcar como enviado",
      descricao: "Registra a expedicao do pedido e deixa a conclusao para a confirmacao do comprador.",
    };
  }

  return null;
}

function criarMensagemBloqueioFluxoOperacional(pedido: PerfilPedidoDetalhe | null) {
  if (!pedido) {
    return "";
  }

  if (obterAcaoOperacionalPrimaria(pedido)) {
    return "";
  }

  if (pedido.statusVenda == null) {
    return "O pedido ainda nao possui uma venda financeira vinculada para a loja. Aguarde a liberacao do backend para iniciar o fluxo operacional.";
  }

  if (pedido.statusFluxoKey === "pendente") {
    return "A venda esta pendente e aguarda o aceite operacional da loja para entrar em separacao.";
  }

  if (pedido.statusFluxoKey === "em-separacao") {
    return "A venda ainda nao pode ser marcada como pronta porque o backend nao liberou essa transicao neste momento.";
  }

  if (pedido.statusFluxoKey === "pronto") {
    return "A venda ainda nao pode ser marcada como enviada porque o backend nao liberou essa transicao neste momento.";
  }

  if (pedido.statusFluxoKey === "cancelado") {
    return "Esta venda ja foi cancelada.";
  }

  if (pedido.statusFluxoKey === "finalizado") {
    return "Esta venda ja foi concluida.";
  }

  if (pedido.statusFluxoKey === "enviado") {
    return "A venda ja foi marcada como enviada e agora aguarda a conclusao do pedido.";
  }

  return "Nao ha mudancas operacionais disponiveis para esta venda no momento.";
}

function criarMensagemBloqueioCancelamento(pedido: PerfilPedidoDetalhe | null) {
  if (!pedido || pedido.podeCancelar) {
    return "";
  }

  if (pedido.pedidoMultiloja) {
    return "Cancelamento indisponivel para pedidos multiloja, porque o backend ainda nao suporta cancelamento parcial por vendedor.";
  }

  if (pedido.statusFluxoKey === "enviado") {
    return "A venda ja foi enviada e nao pode mais ser cancelada pela loja.";
  }

  if (pedido.statusFluxoKey === "pronto" || pedido.statusFluxoKey === "em-separacao") {
    return "A venda ja avancou no fluxo operacional e nao pode mais ser cancelada pela loja.";
  }

  if (pedido.statusFluxoKey === "finalizado") {
    return "A venda ja foi concluida e nao pode mais ser cancelada pela loja.";
  }

  if (pedido.statusFluxoKey === "cancelado") {
    return "Esta venda ja esta cancelada.";
  }

  return "O backend nao liberou cancelamento para esta venda.";
}

export function ModalPedidoVenda({
  descricao,
  isOpen,
  isCarregandoPedido = false,
  isCarregandoSolicitacoes = false,
  isAtualizandoPedido = false,
  pedido,
  solicitacoesCancelamento,
  onAtualizarStatus,
  onCancelarPedido,
  onClose,
}: ModalPedidoVendaProps) {
  const acaoOperacional = obterAcaoOperacionalPrimaria(pedido);
  const podeCancelarPedido = Boolean(pedido?.podeCancelar) && !isAtualizandoPedido;
  const mensagemBloqueioFluxo = criarMensagemBloqueioFluxoOperacional(pedido);
  const mensagemBloqueioCancelamento = criarMensagemBloqueioCancelamento(pedido);
  const solicitacaoAtiva =
    solicitacoesCancelamento.find((solicitacao) =>
      ["Aberta", "EmAnalise", "Aprovada"].includes(solicitacao.status),
    ) ?? null;

  return (
    <ProfileModal
      isOpen={isOpen}
      title={pedido ? `Gerenciar pedido #${pedido.pedidoId}` : "Gerenciar pedido"}
      description={descricao}
      onClose={onClose}
    >
      {pedido ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Status da venda</p>
              <p className="mt-2 text-sm font-semibold text-white">{pedido.status}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Status do pedido</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {pedido.statusPedido ?? pedido.status}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
                <CalendarDays className="h-4 w-4" />
                <span>Data</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{pedido.dataPedido}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Valor da loja</p>
              <p className="mt-2 text-sm font-semibold text-yellow-300">{pedido.total}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-yellow-300" />
                <h3 className="text-sm font-semibold text-white">Cliente</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <p className="font-medium text-white">{pedido.nomeCliente ?? "Cliente nao informado"}</p>
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                  <p>{pedido.emailCliente ?? "Email nao informado"}</p>
                </div>
              </div>
            </div>

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
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-yellow-300" />
              <h3 className="text-sm font-semibold text-white">Produtos da loja neste pedido</h3>
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

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-300" />
                <h3 className="text-sm font-semibold text-white">Observacoes do pedido</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <p>{pedido.observacao}</p>
                {pedido.pedidoMultiloja ? (
                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-yellow-100">
                    <div className="flex items-start gap-2">
                      <Store className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                      <p>
                        Este pedido possui itens de outras lojas. O cancelamento pela loja fica
                        bloqueado enquanto o backend nao suportar cancelamento parcial por vendedor.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-yellow-300" />
                <h3 className="text-sm font-semibold text-white">Resumo financeiro</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Itens da loja</span>
                  <span>{pedido.subtotal}</span>
                </div>
                {pedido.valorTotalPedido ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Total do pedido</span>
                    <span>{pedido.valorTotalPedido}</span>
                  </div>
                ) : null}
                {!pedido.pedidoMultiloja && pedido.frete ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Frete do pedido</span>
                    <span>{pedido.frete}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <span className="font-medium text-white">Total considerado pela loja</span>
                  <span className="font-semibold text-yellow-300">{pedido.total}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">Tratativas de cancelamento</p>
                  <p className="mt-1 text-sm text-neutral-300">
                    Use este bloco para acompanhar quando o comprador abrir uma solicitacao ligada
                    a este pedido.
                  </p>
                </div>

                {pedido.possuiSolicitacaoCancelamentoAtiva || solicitacaoAtiva ? (
                  <div className="rounded-2xl border border-red-400/20 bg-black/30 px-4 py-3 text-sm text-red-100">
                    Existe uma solicitacao ativa vinculada a este pedido. Revise a tratativa do
                    comprador antes de seguir com o fluxo operacional.
                  </div>
                ) : null}

                {isCarregandoSolicitacoes ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                    Carregando historico das solicitacoes do comprador...
                  </div>
                ) : solicitacoesCancelamento.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                    Nenhuma solicitacao de cancelamento foi aberta para este pedido ate o momento.
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
                              Cliente: {solicitacao.nomeCliente}
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
                            <span className="text-neutral-500">Motivo:</span>{" "}
                            {formatarMotivoSolicitacao(solicitacao.motivo)}
                          </p>
                          <p>
                            <span className="text-neutral-500">Criada em:</span>{" "}
                            {formatarDataHora(solicitacao.dataCriacao)}
                          </p>
                          {solicitacao.observacao ? (
                            <p>
                              <span className="text-neutral-500">Observacao do cliente:</span>{" "}
                              {solicitacao.observacao}
                            </p>
                          ) : null}
                          {solicitacao.observacaoAnalise ? (
                            <p>
                              <span className="text-neutral-500">Analise registrada:</span>{" "}
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
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">Acoes do vendedor</p>
                  <p className="mt-1 text-sm text-neutral-300">
                    O painel usa as permissoes devolvidas pelo backend para decidir quando a loja
                    pode aceitar, separar, marcar como pronta, enviar ou cancelar a propria venda.
                  </p>
                </div>

                {isCarregandoPedido ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                    Atualizando detalhes e regras desta venda...
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-3">
                      {acaoOperacional ? (
                        <Botao
                          type="button"
                          onClick={() => onAtualizarStatus(pedido, acaoOperacional.statusVenda)}
                          icon={<CheckCheck className="h-4 w-4" />}
                          disabled={isAtualizandoPedido}
                          className="sm:px-4"
                        >
                          {isAtualizandoPedido ? "Salvando..." : acaoOperacional.label}
                        </Botao>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                          {mensagemBloqueioFluxo}
                        </div>
                      )}

                      {acaoOperacional ? (
                        <p className="text-sm text-neutral-300">{acaoOperacional.descricao}</p>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      {podeCancelarPedido ? (
                        <Botao
                          type="button"
                          variant="secondary"
                          onClick={() => onCancelarPedido(pedido)}
                          icon={<XCircle className="h-4 w-4" />}
                          disabled={isAtualizandoPedido}
                          className="border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/20 sm:px-4"
                        >
                          Cancelar venda
                        </Botao>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                          {mensagemBloqueioCancelamento}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Botao
              type="button"
              variant="secondary"
              onClick={onClose}
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
