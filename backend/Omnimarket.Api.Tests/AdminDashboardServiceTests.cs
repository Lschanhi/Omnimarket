using Microsoft.EntityFrameworkCore;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Services;
using Omnimarket.Api.Tests.Support;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Tests;

public class AdminDashboardServiceTests
{
    [Fact]
    public async Task ObterDashboardAsync_DeveConsolidarMetricasSemFalhar()
    {
        using var fixture = new ServiceTestFixture();

        await fixture.CriarUsuarioAsync("admin", RolesSistema.Admin);
        var pedidoPago = await fixture.CriarPedidoPagoAsync(quantidade: 2, preco: 40m, estoque: 10);
        var pedidoEntregue = await fixture.CriarPedidoEntregueAsync(quantidade: 1, preco: 90m, estoque: 5);
        var vendedorExtra = await fixture.CriarUsuarioAsync("vendedor-extra", RolesSistema.Vendedor);
        var lojaExtra = await fixture.CriarLojaAsync(vendedorExtra.Id, ativa: false, nomeFantasia: "Loja Extra");
        var produtoExtra = await fixture.CriarProdutoAsync(vendedorExtra.Id, preco: 25m, estoque: 3, status: StatusProduto.Rascunho);

        var lojaPedidoPago = await fixture.Context.TBL_LOJA.SingleAsync(l => l.UsuarioId == pedidoPago.VendedorId);
        var lojaPedidoEntregue = await fixture.Context.TBL_LOJA.SingleAsync(l => l.UsuarioId == pedidoEntregue.VendedorId);
        var produtoPedidoPago = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == pedidoPago.ProdutoId);
        var produtoPedidoEntregue = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == pedidoEntregue.ProdutoId);

        lojaPedidoPago.TotalVisualizacoes = 35;
        lojaPedidoEntregue.TotalVisualizacoes = 20;
        lojaExtra.TotalVisualizacoes = 60;

        produtoPedidoPago.TotalVisualizacoes = 55;
        produtoPedidoEntregue.TotalVisualizacoes = 25;
        produtoExtra.TotalVisualizacoes = 10;

        await fixture.Context.SaveChangesAsync();
        fixture.Context.ChangeTracker.Clear();

        var receitaEsperada = await fixture.Context.TBL_VENDA.SumAsync(v => v.ValorBruto);
        var comissaoEsperada = await fixture.Context.TBL_VENDA.SumAsync(v => v.ValorBruto - v.ValorLiquido);

        var service = new AdminDashboardService(fixture.Context);

        var dashboard = await service.ObterDashboardAsync();

        Assert.Equal(6, dashboard.TotalUsuarios);
        Assert.Equal(1, dashboard.TotalAdmins);
        Assert.Equal(3, dashboard.TotalLojas);
        Assert.Equal(2, dashboard.TotalLojasAtivas);
        Assert.Equal(3, dashboard.TotalProdutos);
        Assert.Equal(2, dashboard.ProdutosPublicados);
        Assert.Equal(2, dashboard.TotalPedidos);
        Assert.Equal(0, dashboard.PedidosPendentes);
        Assert.Equal(2, dashboard.PedidosPagos);
        Assert.Equal(receitaEsperada, dashboard.ReceitaTotalMarketplace);
        Assert.Equal(comissaoEsperada, dashboard.ComissaoTotalMarketplace);
        Assert.Equal(115, dashboard.TotalVisualizacoesLojas);
        Assert.Equal(90, dashboard.TotalVisualizacoesProdutos);
        Assert.Equal(205, dashboard.TotalAcessosCatalogo);
        Assert.Equal(7, dashboard.ReceitaPorDia.Count);
        Assert.Equal(7, dashboard.PedidosPorDia.Count);
        Assert.Equal(2, dashboard.PedidosPorStatus.Sum(item => item.Total));
        Assert.Equal(2, dashboard.VendasPorStatus.Sum(item => item.Total));
        Assert.Equal(produtoPedidoPago.Id, dashboard.ProdutosMaisVendidos.First().ProdutoId);
        Assert.Equal(produtoPedidoPago.Id, dashboard.ProdutosMaisVisualizados.First().ProdutoId);
        Assert.Equal(lojaExtra.Id, dashboard.LojasMaisVisitadas.First().LojaId);
        Assert.Equal(lojaPedidoEntregue.Id, dashboard.LojasComMaiorReceita.First().LojaId);
    }
}
