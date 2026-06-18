import { apiRequest } from "../http/apiClient";

export type AdminSerieDiariaApiResponse = {
  data: string;
  label: string;
  total: number;
  valor: number;
};

export type AdminStatusResumoApiResponse = {
  chave: string;
  label: string;
  total: number;
  valorTotal: number;
};

export type AdminRankingProdutoApiResponse = {
  produtoId: number;
  nome: string;
  nomeLoja: string;
  totalQuantidade: number;
  valorTotal: number;
  totalVisualizacoes: number;
};

export type AdminRankingLojaApiResponse = {
  lojaId: number;
  nomeFantasia: string;
  ativa: boolean;
  totalVisualizacoes: number;
  totalProdutosPublicados: number;
  valorBruto: number;
};

export type AdminDashboardApiResponse = {
  totalUsuarios: number;
  totalAdmins: number;
  totalLojas: number;
  totalLojasAtivas: number;
  totalProdutos: number;
  produtosPublicados: number;
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosPagos: number;
  receitaTotalMarketplace: number;
  comissaoTotalMarketplace: number;
  ticketMedioPedidos: number;
  totalVisualizacoesLojas: number;
  totalVisualizacoesProdutos: number;
  totalAcessosCatalogo: number;
  receitaPorDia: AdminSerieDiariaApiResponse[];
  pedidosPorDia: AdminSerieDiariaApiResponse[];
  pedidosPorStatus: AdminStatusResumoApiResponse[];
  vendasPorStatus: AdminStatusResumoApiResponse[];
  produtosMaisVendidos: AdminRankingProdutoApiResponse[];
  produtosMaisVisualizados: AdminRankingProdutoApiResponse[];
  lojasMaisVisitadas: AdminRankingLojaApiResponse[];
  lojasComMaiorReceita: AdminRankingLojaApiResponse[];
};

export async function obterDashboardAdmin() {
  return apiRequest<AdminDashboardApiResponse>("/api/admin/dashboard", {
    authenticated: true,
  });
}
