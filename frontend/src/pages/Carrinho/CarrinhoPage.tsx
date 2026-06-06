import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Botao } from "../../Components/Botao";
import { CartItem } from "../../Components/cart/CartItem";
import { CartSummary } from "../../Components/cart/CartSummary";
import { PageLayout } from "../../Components/PageLayout";
import { Spotlight } from "../../Components/home/SpotLight";
import { useCart } from "../../context/CartContext";

export function CarrinhoPage() {
  const navigate = useNavigate();
  const {
    carrinhoItens,
    valorTotal,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    isLoading,
    erro,
    estaAutenticado,
  } = useCart();

  function handleGoToStore() {
    navigate({ to: "/" });
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <Spotlight>
            <section className="relative overflow-hidden space-y-3 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_48%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <span className="inline-flex w-fit rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
                Carrinho
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Revise seus itens antes de finalizar a compra
                </h1>
                <p className="text-sm leading-6 text-neutral-400 sm:text-base">
                  Aqui você pode alterar a quantidade de itens, verificar subtotal e ir para a finalização de sua compra
                </p>
              </div>
            </section>
          </Spotlight>

          {!estaAutenticado ? (
            <section className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-[32px] border border-dashed border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] px-6 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">
                  Faça login para acessar seu carrinho
                </h2>
                <p className="max-w-md text-sm leading-6 text-neutral-400">
                  O carrinho precisa da sua conta autenticada para sincronizar os
                  itens com a API.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Botao onClick={() => navigate({ to: "/login" })}>Ir para login</Botao>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  Continuar navegando
                </Link>
              </div>
            </section>
          ) : null}

          {estaAutenticado && isLoading ? (
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center text-neutral-300">
              Carregando carrinho...
            </section>
          ) : null}

          {estaAutenticado && erro ? (
            <section className="rounded-[32px] border border-red-400/20 bg-red-500/5 p-6 text-sm text-red-200">
              {erro}
            </section>
          ) : null}

          {estaAutenticado && !isLoading && carrinhoItens.length === 0 ? (
            <section className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-[32px] border border-dashed border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] px-6 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                <ShoppingBag className="h-9 w-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">
                  Seu carrinho está vazio.
                </h2>
                <p className="max-w-md text-sm leading-6 text-neutral-400">
                  Explore a loja e adicione produtos para montar seu pedido.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <Botao
                  onClick={handleGoToStore}
                  className="h-14 rounded-2xl bg-yellow-400 text-black shadow-[0_0_32px_rgba(250,204,21,0.16)] hover:bg-yellow-300"
                >
                  Voltar para loja
                </Botao>
              </div>
            </section>
          ) : null}

          {estaAutenticado && !isLoading && carrinhoItens.length > 0 ? (
            <>
              <section className="space-y-4">
                {carrinhoItens.map((item) => (
                  <CartItem
                    key={item.produtoId}
                    item={item}
                    onIncrease={increaseQuantity}
                    onDecrease={decreaseQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </section>

              <CartSummary subtotal={valorTotal} />

              <Botao
                className="h-14 rounded-2xl bg-yellow-400 text-black shadow-[0_0_36px_rgba(250,204,21,0.18)] hover:bg-yellow-300"
                onClick={() => navigate({ to: "/paginaPagamento" })}
              >
                Finalizar compra
              </Botao>
            </>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
