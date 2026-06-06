import { useLocation, useNavigate } from "@tanstack/react-router";
import { CheckCircle, HomeIcon, ShoppingCart } from "lucide-react";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";

type SuccessState = {
  checkoutResult?: {
    pedidoId: number;
    pedidoIds?: number[];
    pedidos?: Array<{
      pedidoId: number;
      lojaNome: string;
      total: number;
      statusPagamento: string;
      itens: Array<{
        produtoId: number;
        nome: string;
        quantidade: number;
        subtotal: number;
      }>;
    }>;
    total: number;
    metodoPagamento: string;
    statusPagamento: string;
    itens: Array<{
      produtoId: number;
      nome: string;
      quantidade: number;
      subtotal: number;
    }>;
  };
};

export function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SuccessState;
  const checkoutResult = state.checkoutResult;
  const pedidosGerados =
    checkoutResult?.pedidos?.length
      ? checkoutResult.pedidos
      : checkoutResult
        ? [
            {
              pedidoId: checkoutResult.pedidoId,
              lojaNome: "Pedido principal",
              total: checkoutResult.total,
              statusPagamento: checkoutResult.statusPagamento,
              itens: checkoutResult.itens,
            },
          ]
        : [];

  if (!checkoutResult) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center text-white">
          <h1 className="text-2xl">Nenhuma informacao de compra encontrada.</h1>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl bg-[#0f0f0f] p-8 text-center shadow-lg">
          <CheckCircle className="h-20 w-20 text-green-500" />

          <h1 className="text-[clamp(24px,4vw,40px)] font-bold text-white">
            Compra realizada com sucesso!
          </h1>

          <p className="text-[clamp(14px,2vw,18px)] text-gray-400">
            Obrigado pela sua compra.
          </p>

          <div className="h-[1px] w-full bg-gray-700" />

          <div className="flex w-full flex-col gap-4 text-left text-white">
            <div className="flex justify-between">
              <span className="text-gray-400">Pagamento:</span>
              <span>{checkoutResult.metodoPagamento}</span>
            </div>

            <div className="space-y-3">
              <span className="text-gray-400">Itens:</span>
              {checkoutResult.itens.map((item) => (
                <div key={item.produtoId} className="flex justify-between gap-4 text-sm">
                  <span>
                    {item.nome} • {item.quantidade}x
                  </span>
                  <span className="text-yellow-400">
                    {item.subtotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Preço:</span>
              <span className="font-bold text-yellow-500">
                {checkoutResult.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="font-semibold text-green-500">
                {checkoutResult.statusPagamento}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-gray-400">
                {pedidosGerados.length > 1 ? "Pedidos gerados:" : "Pedido:"}
              </span>

              {pedidosGerados.map((pedidoAtual) => (
                <div
                  key={pedidoAtual.pedidoId}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-white">
                      #{pedidoAtual.pedidoId} - {pedidoAtual.lojaNome}
                    </span>
                    <span className="text-yellow-400">
                      {pedidoAtual.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[1px] w-full bg-gray-700" />

          <p className="text-sm text-gray-400">
            Você receberá mais informações sobre o pedido em seguida.
          </p>

          <div className="flex w-full flex-col gap-4 pt-4 md:flex-row">
            <Botao
              className="w-full"
              onClick={() => navigate({ to: "/" })}
              icon={<HomeIcon className="h-5 w-5" />}
            >
              Voltar para Página Principal
            </Botao>

            <Botao
              className="w-full"
              onClick={() => navigate({ to: "/carrinho" })}
              icon={<ShoppingCart className="h-5 w-5" />}
            >
              Voltar ao carrinho
            </Botao>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
