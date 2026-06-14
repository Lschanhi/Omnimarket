import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  QrCode,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";
import { useCart } from "../../context/CartContext";
import {
  confirmarPagamentoFake,
  iniciarPagamento,
} from "../../Services/financeiro/financeiroService";
import { criarPedido } from "../../Services/pedidos/pedidoService";
import { criarEndereco } from "../../Services/user/enderecoService";
import {
  criarCodigoPixFake,
  criarQrCodeApresentacaoUrl,
  formatarCpfCheckout,
  formatarEnderecoCompleto,
  formatarMoedaCheckout,
  type PixCheckoutPendingState,
  type PixCheckoutReviewState,
} from "./pixCheckout";

type ConfirmacaoPixLocationState = {
  pixCheckoutReview?: PixCheckoutReviewState;
};

type PedidoProcessadoResumo = {
  pedidoId: number;
  lojaNome: string;
  total: number;
  statusPagamento: string;
  itens: PixCheckoutPendingState["pedidos"][number]["itens"];
};

function calcularStatusPagamentoFinal(pedidos: PedidoProcessadoResumo[]) {
  return pedidos.every(
    (pedidoAtual) => pedidoAtual.statusPagamento === pedidos[0]?.statusPagamento,
  )
    ? pedidos[0]?.statusPagamento ?? "Confirmado"
    : "Confirmado parcialmente";
}

export function ConfirmacaoPixPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart, carregarCarrinho } = useCart();
  const state = location.state as ConfirmacaoPixLocationState;
  const review = state.pixCheckoutReview;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingPix, setIsConfirmingPix] = useState(false);
  const [erro, setErro] = useState("");
  const [pixDemo, setPixDemo] = useState<PixCheckoutPendingState | null>(null);

  function navegarParaSucesso(pedidosProcessados: PedidoProcessadoResumo[], totalCheckout: number) {
    const todosItens = pedidosProcessados.flatMap((pedidoAtual) => pedidoAtual.itens);

    navigate({
      to: "/paginaSucesso",
      state: (currentState) => ({
        ...currentState,
        checkoutResult: {
          pedidoId: pedidosProcessados[0]?.pedidoId ?? 0,
          pedidoIds: pedidosProcessados.map((pedidoAtual) => pedidoAtual.pedidoId),
          pedidos: pedidosProcessados,
          total: totalCheckout,
          metodoPagamento: review?.metodoPagamentoTitulo ?? "Pagamento",
          statusPagamento: calcularStatusPagamentoFinal(pedidosProcessados),
          itens: todosItens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
            subtotal: item.subtotal,
          })),
        },
      }),
    });
  }

  async function resolverEnderecoIdReview() {
    if (!review) {
      throw new Error("Nenhuma confirmacao de checkout foi encontrada.");
    }

    if (review.endereco.mode === "existing") {
      return review.endereco.enderecoId;
    }

    return (
      await criarEndereco(review.comprador.id, {
        cep: review.endereco.resumo.cep,
        tipoLogradouro: review.endereco.resumo.tipoLogradouro,
        nomeEndereco: review.endereco.resumo.nomeEndereco,
        numero: review.endereco.resumo.numero,
        complemento: review.endereco.resumo.complemento,
        cidade: review.endereco.resumo.cidade,
        uf: review.endereco.resumo.uf,
        isPrincipal: review.endereco.resumo.isPrincipal,
      })
    ).id;
  }

  async function handleCopiarCodigoPix() {
    if (!pixDemo) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pixDemo.codigoPixFake);
      toast.success("Codigo PIX fake copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o codigo.");
    }
  }

  async function handleConfirmarCheckout() {
    if (!review || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErro("");

    const pagamentosPendentes: PixCheckoutPendingState["pedidos"] = [];
    const pedidosProcessados: PedidoProcessadoResumo[] = [];

    try {
      const enderecoId = await resolverEnderecoIdReview();

      for (const loja of review.lojas) {
        const pedido = await criarPedido({
          enderecoId,
          tipoEntregaId: loja.tipoEntregaId,
          observacao:
            review.metodoPagamentoCodigo === "pix"
              ? "Checkout PIX fake via web"
              : `Checkout web via ${review.metodoPagamentoCodigo}`,
          itens: loja.itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          })),
        });

        const pagamento = await iniciarPagamento({
          pedidoId: pedido.pedidoId,
          formaPagamentoId: review.formaPagamentoId,
          observacao: `Checkout web via ${review.metodoPagamentoCodigo}`,
        });

        const valorFreteFinal =
          Number(pedido.valorFrete) > 0 ? Number(pedido.valorFrete) : loja.frete;
        const totalFinal = Number(pedido.valorProdutos) + valorFreteFinal;

        if (review.metodoPagamentoCodigo === "pix") {
          pagamentosPendentes.push({
            pedidoId: pedido.pedidoId,
            planoPagamentoId: pagamento.planoPagamentoId,
            lojaNome: loja.lojaNome,
            total: totalFinal,
            statusPagamento: pagamento.statusPagamento,
            itens: loja.itens,
          });
          continue;
        }

        const confirmacao = await confirmarPagamentoFake(pagamento.planoPagamentoId);

        pedidosProcessados.push({
          pedidoId: pedido.pedidoId,
          lojaNome: loja.lojaNome,
          total: totalFinal,
          statusPagamento: confirmacao.statusPagamento,
          itens: loja.itens,
        });
      }

      await clearCart();

      if (review.metodoPagamentoCodigo === "pix") {
        const totalFinalCheckout = pagamentosPendentes.reduce(
          (accumulator, pedidoAtual) => accumulator + pedidoAtual.total,
          0,
        );

        setPixDemo({
          comprador: review.comprador,
          endereco: review.endereco.resumo,
          pedidos: pagamentosPendentes,
          subtotal: review.subtotal,
          freteTotal: review.freteTotal,
          total: totalFinalCheckout,
          metodoPagamentoTitulo: review.metodoPagamentoTitulo,
          redirecionamentoQrUrl: review.redirecionamentoQrUrl,
          codigoPixFake: criarCodigoPixFake({
            pedidoPrincipalId: pagamentosPendentes[0]?.pedidoId ?? 0,
            total: totalFinalCheckout,
            nomeComprador: review.comprador.nome,
          }),
          qrCodeUrl: criarQrCodeApresentacaoUrl(review.redirecionamentoQrUrl),
        });
        return;
      }

      navegarParaSucesso(
        pedidosProcessados,
        pedidosProcessados.reduce((accumulator, pedidoAtual) => accumulator + pedidoAtual.total, 0),
      );
    } catch (error) {
      if (pagamentosPendentes.length > 0 || pedidosProcessados.length > 0) {
        await carregarCarrinho().catch(() => undefined);
      }

      const message =
        error instanceof Error ? error.message : "Nao foi possivel confirmar a compra.";
      setErro(
        pagamentosPendentes.length > 0 || pedidosProcessados.length > 0
          ? `Parte da compra ja foi processada para outras lojas. ${message}`
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSimularPagamentoPix() {
    if (!pixDemo || isConfirmingPix) {
      return;
    }

    setIsConfirmingPix(true);
    setErro("");

    try {
      const confirmacoes = await Promise.all(
        pixDemo.pedidos.map((pedidoAtual) => confirmarPagamentoFake(pedidoAtual.planoPagamentoId)),
      );

      const pedidosProcessados = pixDemo.pedidos.map((pedidoAtual, index) => ({
        pedidoId: pedidoAtual.pedidoId,
        lojaNome: pedidoAtual.lojaNome,
        total: pedidoAtual.total,
        statusPagamento: confirmacoes[index]?.statusPagamento ?? pedidoAtual.statusPagamento,
        itens: pedidoAtual.itens,
      }));

      navegarParaSucesso(pedidosProcessados, pixDemo.total);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Nao foi possivel simular o pagamento PIX.",
      );
    } finally {
      setIsConfirmingPix(false);
    }
  }

  if (!review) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center px-4 text-white">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
            <h1 className="text-2xl font-semibold">Nenhuma revisao de checkout encontrada</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Volte ao checkout e selecione novamente a forma de pagamento para revisar os dados.
            </p>
            <div className="mt-6">
              <Botao onClick={() => navigate({ to: "/paginaPagamento" })}>
                Voltar ao checkout
              </Botao>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                  Confirmacao do pedido
                </span>
                <h1 className="mt-2 text-3xl font-bold">Revise os dados antes de finalizar</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Confira comprador, endereco, produtos, entrega e forma de pagamento antes de
                  concluir o checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate({ to: "/paginaPagamento" })}
                className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-yellow-300">
                    <User className="h-5 w-5" />
                    <h2 className="font-semibold text-white">Comprador</h2>
                  </div>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <p>
                      <span className="text-zinc-500">Nome:</span> {review.comprador.nome}
                    </p>
                    <p>
                      <span className="text-zinc-500">E-mail:</span> {review.comprador.email}
                    </p>
                    <p>
                      <span className="text-zinc-500">CPF:</span>{" "}
                      {formatarCpfCheckout(review.comprador.cpf)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-yellow-300">
                    <MapPin className="h-5 w-5" />
                    <h2 className="font-semibold text-white">Endereco de entrega</h2>
                  </div>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <p>{formatarEnderecoCompleto(review.endereco.resumo)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-yellow-300">
                    <CreditCard className="h-5 w-5" />
                    <h2 className="font-semibold text-white">Pagamento</h2>
                  </div>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <p>
                      <span className="text-zinc-500">Metodo:</span> {review.metodoPagamentoTitulo}
                    </p>
                    {review.detalhePagamento ? (
                      <p>
                        <span className="text-zinc-500">Detalhe:</span> {review.detalhePagamento}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h2 className="font-semibold text-white">Totais da compra</h2>
                  <div className="mt-4 space-y-3 text-sm text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>{formatarMoedaCheckout(review.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Frete</span>
                      <span>{formatarMoedaCheckout(review.freteTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                      <span>Total</span>
                      <span className="text-yellow-300">{formatarMoedaCheckout(review.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
            <div className="mb-5 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-semibold text-white">Lojas e produtos</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Cada bloco abaixo mostra os itens, a entrega escolhida e o total que vai entrar no
                fechamento do pedido.
              </p>
            </div>

            <div className="space-y-4">
              {review.lojas.map((loja) => (
                <div
                  key={`${loja.lojaId}-${loja.lojaNome}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{loja.lojaNome}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{loja.descricaoEntrega}</p>
                    </div>
                    <span className="text-sm font-semibold text-yellow-300">
                      {formatarMoedaCheckout(loja.total)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {loja.itens.map((item) => (
                      <div
                        key={`${loja.lojaId}-${item.produtoId}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-white">{item.nome}</p>
                          <p className="text-zinc-500">Quantidade: {item.quantidade}</p>
                        </div>
                        <span className="text-yellow-300">
                          {formatarMoedaCheckout(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {erro ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {erro}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Botao
                variant="secondary"
                onClick={() => navigate({ to: "/paginaPagamento" })}
                disabled={isSubmitting || isConfirmingPix}
              >
                Ajustar checkout
              </Botao>

              <Botao
                onClick={() => {
                  void handleConfirmarCheckout();
                }}
                disabled={isSubmitting || isConfirmingPix}
                icon={<CheckCircle2 className="h-5 w-5" />}
              >
                {isSubmitting ? "Confirmando..." : "Confirmar compra"}
              </Botao>
            </div>
          </section>
        </div>
      </div>

      {pixDemo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-[0_0_60px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                  PIX demonstrativo
                </span>
                <h2 className="mt-2 text-3xl font-bold">QR fake para a apresentacao</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Este modal e exclusivo do PIX. O QR abaixo e demonstrativo e pode ser usado para
                  abrir a OmniMarket durante a apresentacao.
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-zinc-300">
                <p className="font-medium text-white">Valor total</p>
                <p className="mt-1 text-xl font-semibold text-yellow-300">
                  {formatarMoedaCheckout(pixDemo.total)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-center">
                  <div className="mb-4 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 p-3 text-yellow-300">
                    <QrCode className="h-7 w-7" />
                  </div>

                  <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white p-3">
                    <img
                      src={pixDemo.qrCodeUrl}
                      alt="QR demonstrativo da apresentacao"
                      className="h-full w-full rounded-2xl object-contain"
                    />
                  </div>

                  <p className="mt-4 text-sm text-zinc-400">
                    QR demonstrativo da apresentacao. Ao escanear, ele abre a OmniMarket para quem
                    estiver assistindo.
                  </p>

                  <div className="mt-4">
                    <a
                      href={pixDemo.redirecionamentoQrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 transition hover:border-yellow-400/40 hover:text-yellow-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir link da demonstracao
                    </a>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-yellow-400/80">
                    Copia e cola fake
                  </p>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="break-all font-mono text-sm leading-7 text-zinc-200">
                      {pixDemo.codigoPixFake}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Botao
                      onClick={() => {
                        void handleCopiarCodigoPix();
                      }}
                      icon={<Copy className="h-5 w-5" />}
                      disabled={isConfirmingPix}
                    >
                      Copiar codigo PIX fake
                    </Botao>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-xl font-semibold text-white">Resumo da demonstracao</h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Comprador
                      </p>
                      <p className="mt-2 font-semibold text-white">{pixDemo.comprador.nome}</p>
                      <p className="mt-1 text-sm text-zinc-400">{pixDemo.comprador.email}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatarCpfCheckout(pixDemo.comprador.cpf)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Endereco</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {formatarEnderecoCompleto(pixDemo.endereco)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Pedidos pendentes
                    </p>
                    <div className="mt-3 space-y-3">
                      {pixDemo.pedidos.map((pedidoAtual) => (
                        <div
                          key={pedidoAtual.pedidoId}
                          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">
                                #{pedidoAtual.pedidoId} - {pedidoAtual.lojaNome}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Status atual: {pedidoAtual.statusPagamento}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-yellow-300">
                              {formatarMoedaCheckout(pedidoAtual.total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    Depois de mostrar o QR na apresentacao, clique em "Simular pagamento PIX" para
                    concluir o checkout fake e seguir para a tela de sucesso.
                  </div>

                  {erro ? (
                    <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {erro}
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <Botao
                      onClick={() => {
                        void handleSimularPagamentoPix();
                      }}
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      disabled={isConfirmingPix}
                    >
                      {isConfirmingPix ? "Confirmando PIX fake..." : "Simular pagamento PIX"}
                    </Botao>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
