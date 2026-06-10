import { apiRequest } from "../http/apiClient";

export type UsuarioPerfilApiResponse = {
  id: number;
  cpf: string;
  nome: string;
  sobrenome: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  telefones: Array<{
    id: number;
    numeroE164: string;
    isPrincipal: boolean;
  }>;
  enderecos: Array<{
    id: number;
    tipoLogradouro: string;
    nomeEndereco: string;
    numero: string;
    cep: string;
    cidade: string;
    uf: string;
    isPrincipal: boolean;
    ativo: boolean;
  }>;
};

export type UsuarioAtualizacaoPayload = {
  nome: string;
  sobrenome: string;
  email: string;
  password?: string;
};

export type UsuarioAtualizacaoResponse = {
  mensagem: string;
  usuario: {
    id: number;
    nome: string;
    sobrenome: string;
    email: string;
  };
};

export type UsuarioFotoPerfilPayload = {
  dataUrl: string;
  nomeArquivo?: string;
};

export type UsuarioFotoPerfilResponse = {
  mensagem: string;
  fotoPerfil: {
    avatarUrl: string;
    mimeType: string;
    nomeArquivo: string;
    dtAtualizacao?: string | null;
  };
};

export type LojaMetricasApiResponse = {
  lojaId: number;
  nomeFantasia: string;
  faturamentoBruto: number;
  faturamentoLiquido: number;
  ticketMedio: number;
  taxaCancelamento: number;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  pedidosPorStatus: Array<{
    status: string;
    total: number;
  }>;
  produtosMaisVendidosPorQuantidade: Array<{
    produtoId: number;
    nome: string;
    sku: string;
    quantidadeVendida: number;
    receitaBruta: number;
  }>;
  produtosMaisVendidosPorReceita: Array<{
    produtoId: number;
    nome: string;
    sku: string;
    quantidadeVendida: number;
    receitaBruta: number;
  }>;
};

export type PedidoLeituraApiResponse = {
  id: number;
  status: string;
  tipoEntrega: string;
  valorTotalProdutos: number;
  valorFrete: number;
  valorTotalPedido: number;
  dataPedido: string;
  observacao: string;
  tipoLogradouroEntrega: string;
  nomeEnderecoEntrega: string;
  numeroEntrega: string;
  complementoEntrega?: string | null;
  cepEntrega: string;
  cidadeEntrega: string;
  ufEntrega: string;
  podeCancelar?: boolean;
  podeConfirmarRecebimento?: boolean;
  possuiSolicitacaoCancelamentoAtiva?: boolean;
  itens: Array<{
    id: number;
    produtoId: number;
    nomeProduto: string;
    skuProduto?: string;
    lojaId: number;
    nomeLoja: string;
    slugLoja?: string;
    quantidade: number;
    precoUnitario: number;
    valorTotal: number;
  }>;
};

export async function obterPerfilUsuario() {
  return apiRequest<UsuarioPerfilApiResponse>("/api/usuario/me", {
    authenticated: true,
  });
}

export async function atualizarPerfilUsuario(
  usuarioId: number,
  payload: UsuarioAtualizacaoPayload,
) {
  return apiRequest<UsuarioAtualizacaoResponse>(`/api/usuario/${usuarioId}`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export async function atualizarFotoPerfil(payload: UsuarioFotoPerfilPayload) {
  return apiRequest<UsuarioFotoPerfilResponse>("/api/usuario/me/foto-perfil", {
    method: "PUT",
    authenticated: true,
    body: payload,
  });
}

export async function removerFotoPerfil() {
  return apiRequest<{ mensagem: string }>("/api/usuario/me/foto-perfil", {
    method: "DELETE",
    authenticated: true,
  });
}

export async function listarPedidosUsuario(usuarioId: number) {
  return apiRequest<PedidoLeituraApiResponse[]>(`/api/pedidos/usuario/${usuarioId}`, {
    authenticated: true,
  });
}

export async function obterMinhasMetricasLoja() {
  return apiRequest<LojaMetricasApiResponse>("/api/lojas/minha/metricas", {
    authenticated: true,
  });
}
