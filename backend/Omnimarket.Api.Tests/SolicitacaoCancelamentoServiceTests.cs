using Omnimarket.Api.Models.Dtos.Pedidos;
using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class SolicitacaoCancelamentoServiceTests
{
    [Fact]
    public async Task CriarAsync_DeveAbrirSolicitacaoQuandoVendaJaEstiverEnviada()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();

        await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);

        var solicitacao = await fixture.SolicitacaoCancelamentoService.CriarAsync(
            scenario.PedidoId,
            scenario.CompradorId,
            new SolicitacaoCancelamentoCriacaoDto
            {
                Motivo = MotivoSolicitacaoCancelamento.AtrasoEntrega,
                Observacao = "Cliente deseja abrir tratativa."
            });

        Assert.NotNull(solicitacao);
        Assert.Equal(scenario.PedidoId, solicitacao!.PedidoId);
        Assert.Equal(StatusSolicitacaoCancelamento.Aberta, solicitacao.Status);
        Assert.Equal(StatusVenda.Enviada, solicitacao.StatusVendaOrigem);
        Assert.Equal(StatusVenda.Enviada, solicitacao.StatusVendaAtual);
        Assert.Equal(MotivoSolicitacaoCancelamento.AtrasoEntrega, solicitacao.Motivo);
        Assert.True(solicitacao.PodeCancelarPeloSolicitante);
        Assert.True(solicitacao.PodeColocarEmAnalise);
    }

    [Fact]
    public async Task CriarAsync_DeveBloquearSolicitacaoAntesDoEnvio()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.SolicitacaoCancelamentoService.CriarAsync(
                scenario.PedidoId,
                scenario.CompradorId,
                new SolicitacaoCancelamentoCriacaoDto
                {
                    Motivo = MotivoSolicitacaoCancelamento.Arrependimento
                }));

        Assert.Equal(
            "Enquanto o pedido ainda nao foi enviado, use o cancelamento direto em vez de abrir uma solicitacao.",
            excecao.Message);
    }

    [Fact]
    public async Task CriarAsync_DeveExigirVendaIdQuandoPedidoForMultiloja()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoMultilojaAsync();

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.SolicitacaoCancelamentoService.CriarAsync(
                scenario.PedidoId,
                scenario.CompradorId,
                new SolicitacaoCancelamentoCriacaoDto
                {
                    Motivo = MotivoSolicitacaoCancelamento.ProdutoIncorreto
                }));

        Assert.Equal(
            "Este pedido possui mais de uma venda. Informe a venda especifica para abrir a solicitacao.",
            excecao.Message);
    }

    [Fact]
    public async Task AtualizarStatusDaLojaAsync_DevePermitirFluxoDeAnaliseEAprovacao()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);

        var solicitacaoCriada = await fixture.SolicitacaoCancelamentoService.CriarAsync(
            scenario.PedidoId,
            scenario.CompradorId,
            new SolicitacaoCancelamentoCriacaoDto
            {
                Motivo = MotivoSolicitacaoCancelamento.EntregaNaoRecebida
            });

        var emAnalise = await fixture.SolicitacaoCancelamentoService.AtualizarStatusDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            solicitacaoCriada!.Id,
            new SolicitacaoCancelamentoAtualizacaoDto
            {
                Status = StatusSolicitacaoCancelamento.EmAnalise,
                ObservacaoAnalise = "Loja iniciou a verificacao."
            });

        Assert.NotNull(emAnalise);
        Assert.Equal(StatusSolicitacaoCancelamento.EmAnalise, emAnalise!.Status);
        Assert.Equal("Loja iniciou a verificacao.", emAnalise.ObservacaoAnalise);
        Assert.True(emAnalise.PodeAprovar);

        var aprovada = await fixture.SolicitacaoCancelamentoService.AtualizarStatusDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            solicitacaoCriada.Id,
            new SolicitacaoCancelamentoAtualizacaoDto
            {
                Status = StatusSolicitacaoCancelamento.Aprovada,
                ObservacaoAnalise = "Pedido aceito para tratativa."
            });

        Assert.NotNull(aprovada);
        Assert.Equal(StatusSolicitacaoCancelamento.Aprovada, aprovada!.Status);
        Assert.True(aprovada.PodeConcluir);

        var concluida = await fixture.SolicitacaoCancelamentoService.AtualizarStatusDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            solicitacaoCriada.Id,
            new SolicitacaoCancelamentoAtualizacaoDto
            {
                Status = StatusSolicitacaoCancelamento.Concluida
            });

        Assert.NotNull(concluida);
        Assert.Equal(StatusSolicitacaoCancelamento.Concluida, concluida!.Status);
        Assert.NotNull(concluida.DataConclusao);
        Assert.False(concluida.PodeConcluir);
    }

    [Fact]
    public async Task ListarDaLojaAsync_DeveRetornarSolicitacaoCriadaPeloComprador()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);

        var solicitacaoCriada = await fixture.SolicitacaoCancelamentoService.CriarAsync(
            scenario.PedidoId,
            scenario.CompradorId,
            new SolicitacaoCancelamentoCriacaoDto
            {
                Motivo = MotivoSolicitacaoCancelamento.Arrependimento,
                Observacao = "Cliente quer devolver o produto."
            });

        var pagina = await fixture.SolicitacaoCancelamentoService.ListarDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            status: null,
            page: 1,
            pageSize: 20);

        var solicitacao = Assert.Single(pagina.Items);
        Assert.NotNull(solicitacaoCriada);
        Assert.Equal(1, pagina.Total);
        Assert.Equal(solicitacaoCriada!.Id, solicitacao.Id);
        Assert.Equal(scenario.PedidoId, solicitacao.PedidoId);
        Assert.Equal(lojaId, solicitacao.LojaId);
        Assert.Equal(scenario.VendedorId, solicitacao.VendedorId);
        Assert.Equal(StatusSolicitacaoCancelamento.Aberta, solicitacao.Status);
        Assert.Equal(StatusVenda.Enviada, solicitacao.StatusVendaAtual);
    }

    [Fact]
    public async Task CancelarPeloCompradorAsync_DeveCancelarSolicitacaoAberta()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();

        await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);

        var solicitacao = await fixture.SolicitacaoCancelamentoService.CriarAsync(
            scenario.PedidoId,
            scenario.CompradorId,
            new SolicitacaoCancelamentoCriacaoDto
            {
                Motivo = MotivoSolicitacaoCancelamento.Outro,
                Observacao = "Cliente desistiu da solicitacao."
            });

        var cancelada = await fixture.SolicitacaoCancelamentoService.CancelarPeloCompradorAsync(
            solicitacao!.Id,
            scenario.CompradorId);

        Assert.NotNull(cancelada);
        Assert.Equal(StatusSolicitacaoCancelamento.Cancelada, cancelada!.Status);
        Assert.NotNull(cancelada.DataConclusao);
    }
}
