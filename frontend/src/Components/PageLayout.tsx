import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

type PageLayoutProps = {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const { totalItens } = useCart();
  const { location } = useRouterState();
  const esconderCarrinhoFlutuante = location.pathname === "/carrinho";

  return (
    <div className="min-h-screen w-full bg-black">
      {children}

      {!esconderCarrinhoFlutuante ? (
        <Link
          to="/carrinho"
          className="fixed bottom-5 right-4 z-30 inline-flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300 bg-yellow-400 text-black shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition hover:scale-[1.03] hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          aria-label="Abrir carrinho"
          title="Carrinho"
        >
          <ShoppingCart className="h-7 w-7" />

          {totalItens > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-yellow-400 bg-black px-1 text-[10px] font-bold text-yellow-300">
              {totalItens > 99 ? "99+" : totalItens}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  )
}
