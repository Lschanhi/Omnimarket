import { apiRequest } from "../http/apiClient";

export type IniciarPagamentoPayload = {
  pedidoId: number;
  formaPagamentoId: number;
  observacao?: string;
};

export type IniciarPagamentoResponse = {
  pedidoId: number;
  planoPagamentoId: number;
  formaPagamentoId: number;
  valorTotal: number;
  statusPagamento: string;
  vendas: Array<{
    vendaId: number;
    vendedorId: number;
    valorBruto: number;
    valorComissao: number;
    valorLiquido: number;
    statusVenda: string;
  }>;
};

export type ConfirmarPagamentoResponse = {
  planoPagamentoId: number;
  pedidoId: number;
  formaPagamentoId: number;
  statusPagamento: string;
  gatewayTransactionId: string;
  dataConfirmacao?: string | null;
  quantidadeVendasAtualizadas: number;
};

export type ResumoFinanceiroVendedorResponse = {
  totalVendidoBruto: number;
  totalComissaoMarketplace: number;
  totalLiquidoVendedor: number;
  quantidadePedidos: number;
};

export async function iniciarPagamento(payload: IniciarPagamentoPayload) {
  return apiRequest<IniciarPagamentoResponse>("/api/financeiro/pagamentos/iniciar", {
    method: "POST",
    authenticated: true,
    body: payload,
  });
}

export async function confirmarPagamentoFake(planoPagamentoId: number) {
  return apiRequest<ConfirmarPagamentoResponse>(
    `/api/financeiro/pagamentos/${planoPagamentoId}/confirmar-fake`,
    {
      method: "POST",
      authenticated: true,
    },
  );
}

export async function getResumoFinanceiroVendedor() {
  return apiRequest<ResumoFinanceiroVendedorResponse>("/api/vendedor/financeiro/resumo", {
    authenticated: true,
  });
}
