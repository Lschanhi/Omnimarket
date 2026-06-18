import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Copy, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";
import { confirmarPagamentoFake } from "../../Services/financeiro/financeiroService";
import {
  criarCheckoutResultState,
  formatarCpfCheckout,
  formatarEnderecoCompleto,
  formatarMoedaCheckout,
  type CheckoutPedidoProcessadoResumo,
  type PixCheckoutPendingState,
} from "./pixCheckout";

type PixApresentacaoLocationState = {
  pixCheckoutPending?: PixCheckoutPendingState;
};

export function PixApresentacaoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PixApresentacaoLocationState;
  const pixState = state.pixCheckoutPending;
  const [isConfirmingPix, setIsConfirmingPix] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCopiarCodigoPix() {
    if (!pixState) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pixState.codigoPixFake);
      toast.success("Codigo PIX fake copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o codigo.");
    }
  }

  function navegarParaSucesso(
    pedidosProcessados: CheckoutPedidoProcessadoResumo[],
    totalCheckout: number,
  ) {
    if (!pixState) {
      return;
    }

    navigate({
      to: "/paginaSucesso",
      state: (currentState) => ({
        ...currentState,
        checkoutResult: criarCheckoutResultState({
          pedidosProcessados,
          totalCheckout,
          metodoPagamento: pixState.metodoPagamentoTitulo,
        }),
      }),
    });
  }

  async function handleSimularPagamentoPix() {
    if (!pixState || isConfirmingPix) {
      return;
    }

    setIsConfirmingPix(true);
    setErro("");

    try {
      const confirmacoes = await Promise.all(
        pixState.pedidos.map((pedidoAtual) => confirmarPagamentoFake(pedidoAtual.planoPagamentoId)),
      );

      const pedidosProcessados: CheckoutPedidoProcessadoResumo[] = pixState.pedidos.map(
        (pedidoAtual, index) => ({
          pedidoId: pedidoAtual.pedidoId,
          lojaNome: pedidoAtual.lojaNome,
          total: pedidoAtual.total,
          statusPagamento: confirmacoes[index]?.statusPagamento ?? pedidoAtual.statusPagamento,
          itens: pedidoAtual.itens,
        }),
      );

      navegarParaSucesso(pedidosProcessados, pixState.total);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Nao foi possivel simular o pagamento PIX.",
      );
    } finally {
      setIsConfirmingPix(false);
    }
  }

  if (!pixState) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center px-4 text-white">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
            <h1 className="text-2xl font-semibold">Nenhuma apresentacao PIX encontrada</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Volte ao checkout, confirme a compra com PIX e abra novamente esta pagina.
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
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <section className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                  PIX demonstrativo
                </span>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  QR da avaliacao da apresentacao
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Esta pagina exibe o QR da avaliacao para a banca durante a demonstracao do fluxo
                  PIX.
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-zinc-300 lg:shrink-0">
                <p className="font-medium text-white">Valor total</p>
                <p className="mt-1 text-xl font-semibold text-yellow-300">
                  {formatarMoedaCheckout(pixState.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center sm:p-5">
                  <div className="mb-4 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 p-3 text-yellow-300">
                    <QrCode className="h-6 w-6" />
                  </div>

                  <div className="mx-auto flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white p-3 sm:h-[210px] sm:w-[210px] lg:h-[230px] lg:w-[230px]">
                    <img
                      src={pixState.qrCodeUrl}
                      alt="QR da avaliacao da apresentacao"
                      className="h-full w-full rounded-2xl object-contain"
                    />
                  </div>

                  <p className="mt-4 text-sm text-zinc-400">
                    QR da avaliacao da apresentacao. Ao escanear, a banca abre o link de avaliacao
                    da OmniMarket.
                  </p>

                  <div className="mt-4 rounded-2xl border border-yellow-400/15 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-100">
                    Escaneie com o celular para abrir a avaliacao da apresentacao.
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-yellow-400/80">
                    Copia e cola fake
                  </p>
                  <div className="mt-3 max-h-36 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="break-all font-mono text-sm leading-7 text-zinc-200">
                      {pixState.codigoPixFake}
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
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
                  <h2 className="text-xl font-semibold text-white">Resumo da demonstracao</h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Comprador</p>
                      <p className="mt-2 font-semibold text-white">{pixState.comprador.nome}</p>
                      <p className="mt-1 text-sm text-zinc-400">{pixState.comprador.email}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatarCpfCheckout(pixState.comprador.cpf)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Endereco</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {formatarEnderecoCompleto(pixState.endereco)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Pedidos pendentes
                    </p>
                    <div className="mt-3 space-y-3">
                      {pixState.pedidos.map((pedidoAtual) => (
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
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
