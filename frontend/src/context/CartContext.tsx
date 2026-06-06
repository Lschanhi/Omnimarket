import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  adicionarItemAoCarrinho,
  atualizarQuantidadeNoCarrinho,
  limparCarrinhoRemoto,
  obterCarrinho,
  removerItemDoCarrinho,
  type CarrinhoApiResponse,
} from "../Services/carrinho/carrinhoService";
import { AUTH_CHANGED_EVENT, isAuthenticated } from "../Services/auth/session";
import { API_BASE_URL } from "../Services/http/apiClient";
import type { CartItemType } from "../types/cart";

type CartContextType = {
  carrinhoItens: CartItemType[];
  totalItens: number;
  valorTotal: number;
  isLoading: boolean;
  erro: string;
  estaAutenticado: boolean;
  carregarCarrinho: () => Promise<void>;
  adicionarAoCarrinho: (produtoId: number) => Promise<void>;
  increaseQuantity: (produtoId: number) => Promise<void>;
  decreaseQuantity: (produtoId: number) => Promise<void>;
  removeItem: (produtoId: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function criarImagemCarrinhoPlaceholder(label: string) {
  const titulo = label.trim().slice(0, 20) || "OmniMarket";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="32" fill="url(#bg)" />
      <circle cx="250" cy="78" r="54" fill="rgba(255,255,255,0.12)" />
      <circle cx="84" cy="236" r="72" fill="rgba(0,0,0,0.16)" />
      <text x="28" y="166" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="700">
        ${titulo}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function resolverImagemCarrinho(url: string | null | undefined, nomeProduto: string) {
  const valor = url?.trim() ?? "";

  if (!valor) {
    return criarImagemCarrinhoPlaceholder(nomeProduto);
  }

  if (/^(?:https?:|data:|blob:)/i.test(valor)) {
    return valor;
  }

  const caminhoNormalizado = valor.startsWith("/") ? valor : `/${valor}`;
  return `${API_BASE_URL}${caminhoNormalizado}`;
}

function mapearCarrinho(response: CarrinhoApiResponse): CartItemType[] {
  return response.itens.map((item) => ({
    produtoId: item.produtoId,
    nome: item.nome,
    preco: Number(item.precoUnitario),
    quantidade: item.quantidade,
    subtotal: Number(item.subtotal),
    lojaId: item.lojaId,
    imagem: resolverImagemCarrinho(item.imagemPrincipal, item.nome),
    descricao: `${item.nomeLoja} • ${item.categoria}`,
    categoria: item.categoria,
    lojaNome: item.nomeLoja,
    estoqueDisponivel: item.estoqueDisponivel,
  }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carrinhoItens, setCarrinhoItens] = useState<CartItemType[]>([]);
  const [totalItens, setTotalItens] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [estaAutenticado, setEstaAutenticado] = useState(isAuthenticated());

  function aplicarCarrinho(response: CarrinhoApiResponse) {
    setCarrinhoItens(mapearCarrinho(response));
    setTotalItens(response.totalItens);
    setValorTotal(Number(response.valorTotal));
  }

  function limparEstadoCarrinho() {
    setCarrinhoItens([]);
    setTotalItens(0);
    setValorTotal(0);
  }

  const carregarCarrinho = useCallback(async () => {
    const autenticado = isAuthenticated();
    setEstaAutenticado(autenticado);

    if (!autenticado) {
      limparEstadoCarrinho();
      setErro("");
      return;
    }

    setIsLoading(true);

    try {
      const response = await obterCarrinho();
      aplicarCarrinho(response);
      setErro("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel carregar o carrinho.";
      setErro(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarCarrinho();

    function handleAuthChange() {
      void carregarCarrinho();
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, [carregarCarrinho]);

  async function adicionarAoCarrinho(produtoId: number) {
    const response = await adicionarItemAoCarrinho(produtoId, 1);
    aplicarCarrinho(response);
    setErro("");
  }

  async function increaseQuantity(produtoId: number) {
    const itemAtual = carrinhoItens.find((item) => item.produtoId === produtoId);

    if (!itemAtual) {
      return;
    }

    const response = await atualizarQuantidadeNoCarrinho(produtoId, itemAtual.quantidade + 1);
    aplicarCarrinho(response);
    setErro("");
  }

  async function decreaseQuantity(produtoId: number) {
    const itemAtual = carrinhoItens.find((item) => item.produtoId === produtoId);

    if (!itemAtual) {
      return;
    }

    if (itemAtual.quantidade <= 1) {
      await removeItem(produtoId);
      return;
    }

    const response = await atualizarQuantidadeNoCarrinho(produtoId, itemAtual.quantidade - 1);
    aplicarCarrinho(response);
    setErro("");
  }

  async function removeItem(produtoId: number) {
    const response = await removerItemDoCarrinho(produtoId);
    aplicarCarrinho(response);
    setErro("");
  }

  async function clearCart() {
    if (!isAuthenticated()) {
      limparEstadoCarrinho();
      return;
    }

    await limparCarrinhoRemoto();
    limparEstadoCarrinho();
    setErro("");
  }

  return (
    <CartContext.Provider
      value={{
        carrinhoItens,
        totalItens,
        valorTotal,
        isLoading,
        erro,
        estaAutenticado,
        carregarCarrinho,
        adicionarAoCarrinho,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart precisa ser usado dentro de CartProvider.");
  }

  return context;
}
