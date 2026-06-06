import { apiRequest } from "../http/apiClient";

export type CarrinhoApiItem = {
  id: number;
  produtoId: number;
  nome: string;
  sku: string;
  categoria: string;
  lojaId: number;
  nomeLoja: string;
  slugLoja: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  estoqueDisponivel: number;
  statusPublicacao: string;
  disponivelParaCompra: boolean;
  imagemPrincipal?: string | null;
};

export type CarrinhoApiResponse = {
  carrinhoId?: number | null;
  itens: CarrinhoApiItem[];
  totalItens: number;
  valorTotal: number;
};

export async function obterCarrinho() {
  return apiRequest<CarrinhoApiResponse>("/api/carrinho", {
    authenticated: true,
  });
}

export async function adicionarItemAoCarrinho(produtoId: number, quantidade = 1) {
  return apiRequest<CarrinhoApiResponse>("/api/carrinho", {
    method: "POST",
    authenticated: true,
    body: {
      produtoId,
      quantidade,
    },
  });
}

export async function atualizarQuantidadeNoCarrinho(produtoId: number, quantidade: number) {
  return apiRequest<CarrinhoApiResponse>(`/api/carrinho/${produtoId}`, {
    method: "PUT",
    authenticated: true,
    body: {
      quantidade,
    },
  });
}

export async function removerItemDoCarrinho(produtoId: number) {
  return apiRequest<CarrinhoApiResponse>(`/api/carrinho/${produtoId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export async function limparCarrinhoRemoto() {
  return apiRequest("/api/carrinho", {
    method: "DELETE",
    authenticated: true,
  });
}
