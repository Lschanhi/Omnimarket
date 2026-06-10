import { apiRequest, apiRequestBlob } from "../http/apiClient";
import type { PedidoLeituraApiResponse } from "../user/usuarioService";

export type CriarPedidoPayload = {
  enderecoId?: number;
  tipoEntregaId: number;
  observacao: string;
  itens: Array<{
    produtoId: number;
    quantidade: number;
  }>;
};

export type CriarPedidoResponse = {
  mensagem: string;
  pedidoId: number;
  valorProdutos: number;
  valorFrete: number;
  valorTotal: number;
  valorComissao: number;
  valorLiquidoVendedor: number;
  taxaFixaComissao: number;
  percentualComissao: number;
  status: string;
};

export type TipoSolicitacaoPedidoApi =
  | "Cancelamento"
  | "Devolucao"
  | "Troca"
  | "ProblemaEntrega";

export type MotivoSolicitacaoCancelamentoApi =
  | "Arrependimento"
  | "AtrasoEntrega"
  | "ProdutoComDefeito"
  | "ProdutoIncorreto"
  | "EntregaNaoRecebida"
  | "Outro";

export type StatusSolicitacaoCancelamentoApi =
  | "Aberta"
  | "EmAnalise"
  | "Aprovada"
  | "Recusada"
  | "Cancelada"
  | "Concluida";

export type SolicitacaoCancelamentoLeituraApiResponse = {
  id: number;
  pedidoId: number;
  vendaId: number;
  clienteId: number;
  nomeCliente: string;
  emailCliente: string;
  vendedorId: number;
  lojaId: number;
  nomeLoja: string;
  statusPedidoAtual: string;
  statusVendaAtual: string;
  statusPedidoOrigem: string;
  statusVendaOrigem: string;
  tipoSolicitacao: TipoSolicitacaoPedidoApi;
  motivo: MotivoSolicitacaoCancelamentoApi;
  status: StatusSolicitacaoCancelamentoApi;
  observacao: string;
  observacaoAnalise?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
  dataAnalise?: string | null;
  dataConclusao?: string | null;
  podeCancelarPeloSolicitante: boolean;
  podeColocarEmAnalise: boolean;
  podeAprovar: boolean;
  podeRecusar: boolean;
  podeConcluir: boolean;
};

export type CriarSolicitacaoCancelamentoPayload = {
  vendaId?: number;
  tipoSolicitacao?: TipoSolicitacaoPedidoApi;
  motivo: MotivoSolicitacaoCancelamentoApi;
  observacao?: string;
};

export type CriarSolicitacaoCancelamentoResponse = {
  mensagem: string;
  solicitacao: SolicitacaoCancelamentoLeituraApiResponse;
};

export type CancelarSolicitacaoCancelamentoResponse = {
  mensagem: string;
  solicitacao: SolicitacaoCancelamentoLeituraApiResponse;
};

export type CancelarPedidoResponse = {
  mensagem: string;
};

export type ConfirmarEntregaPedidoResponse = {
  mensagem: string;
  pedidoId: number;
  status: string;
};

export type AtualizarSolicitacaoCancelamentoPayload = {
  status: StatusSolicitacaoCancelamentoApi;
  observacaoAnalise?: string;
};

export type AtualizarSolicitacaoCancelamentoResponse = {
  mensagem: string;
  solicitacao: SolicitacaoCancelamentoLeituraApiResponse;
};

export async function criarPedido(payload: CriarPedidoPayload) {
  return apiRequest<CriarPedidoResponse>("/api/pedidos", {
    method: "POST",
    authenticated: true,
    body: payload,
  });
}

export async function buscarPedido(id: number) {
  return apiRequest<PedidoLeituraApiResponse>(`/api/pedidos/${id}`, {
    authenticated: true,
  });
}

export async function cancelarPedido(id: number) {
  return apiRequest<CancelarPedidoResponse>(`/api/pedidos/${id}/cancelar`, {
    method: "PUT",
    authenticated: true,
  });
}

export async function confirmarEntregaPedido(id: number) {
  return apiRequest<ConfirmarEntregaPedidoResponse>(`/api/pedidos/${id}/confirmar-entrega`, {
    method: "PUT",
    authenticated: true,
  });
}

export async function baixarReciboPedidoPdf(id: number) {
  return apiRequestBlob(`/api/pedidos/${id}/recibo`, {
    authenticated: true,
    headers: {
      Accept: "application/pdf",
    },
  });
}

export async function listarSolicitacoesCancelamentoPedido(id: number) {
  return apiRequest<SolicitacaoCancelamentoLeituraApiResponse[]>(
    `/api/pedidos/${id}/solicitacoes-cancelamento`,
    {
      authenticated: true,
    },
  );
}

export async function criarSolicitacaoCancelamento(
  pedidoId: number,
  payload: CriarSolicitacaoCancelamentoPayload,
) {
  return apiRequest<CriarSolicitacaoCancelamentoResponse>(
    `/api/pedidos/${pedidoId}/solicitacoes-cancelamento`,
    {
      method: "POST",
      authenticated: true,
      body: payload,
    },
  );
}

export async function cancelarSolicitacaoCancelamento(solicitacaoId: number) {
  return apiRequest<CancelarSolicitacaoCancelamentoResponse>(
    `/api/pedidos/solicitacoes-cancelamento/${solicitacaoId}/cancelar`,
    {
      method: "PUT",
      authenticated: true,
    },
  );
}
