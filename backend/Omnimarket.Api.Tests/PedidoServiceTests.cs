using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class PedidoServiceTests
{
    [Fact]
    public async Task CriarPedido_DeveCriarPedidoPendenteEReduzirEstoque()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPendenteAsync(quantidade: 2, preco: 35m, estoque: 10);

        fixture.Context.ChangeTracker.Clear();

        var pedido = await fixture.Context.TBL_PEDIDO
            .Include(p => p.Itens)
            .SingleAsync(p => p.Id == scenario.PedidoId);

        var produto = await fixture.Context.TBL_PRODUTO
            .Include(p => p.Loja)
            .SingleAsync(p => p.Id == scenario.ProdutoId);

        Assert.Equal(StatusPedido.Pendente, pedido.StatusPedidosId);
        Assert.Equal(70m, pedido.ValorTotalProdutos);
        Assert.Equal(0m, pedido.ValorFrete);
        Assert.Equal(70m, pedido.ValorTotalPedido);
        Assert.Equal(1.50m, pedido.TaxaFixaComissao);
        Assert.Equal(0.05m, pedido.PercentualComissao);
        Assert.Equal(5.00m, pedido.ValorComissao);
        Assert.Equal(65.00m, pedido.ValorLiquidoVendedor);
        Assert.Single(pedido.Itens);
        Assert.Equal(2, pedido.Itens[0].Quantidade);
        Assert.Equal(8, produto.Estoque);
        Assert.Equal(produto.Nome, pedido.Itens[0].NomeProdutoSnapshot);
        Assert.Equal(produto.Loja.NomeFantasia, pedido.Itens[0].NomeLojaSnapshot);
        Assert.Equal(produto.Loja.DocumentoFiscal, pedido.Itens[0].DocumentoLojaSnapshot);
        Assert.Equal(produto.Loja.TipoDocumentoFiscal.ToString(), pedido.Itens[0].TipoDocumentoLojaSnapshot);
    }

    [Fact]
    public async Task CriarPedido_DeveManterPrecoUnitarioOriginalMesmoAposAtualizacaoDoProduto()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPendenteAsync(quantidade: 2, preco: 35m, estoque: 10);

        var atualizado = await fixture.ProdutoService.UpdateAsync(
            scenario.ProdutoId,
            new ProdutoAtualizarDto
            {
                Preco = 49.90m
            },
            scenario.VendedorId);

        fixture.Context.ChangeTracker.Clear();

        var itemPedido = await fixture.Context.TBL_ITENS_PEDIDO
            .SingleAsync(i => i.PedidoId == scenario.PedidoId);

        var produtoAtualizado = await fixture.Context.TBL_PRODUTO
            .SingleAsync(p => p.Id == scenario.ProdutoId);

        Assert.True(atualizado);
        Assert.Equal(35m, itemPedido.PrecoUnitario);
        Assert.Equal(49.90m, produtoAtualizado.Preco);
    }

    [Fact]
    public async Task CriarPedido_DeveUsarCarrinhoQuandoBodyVierSemItens()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("vendedor");
        var comprador = await fixture.CriarUsuarioAsync("comprador");
        var endereco = await fixture.CriarEnderecoAsync(comprador.Id);
        var produto = await fixture.CriarProdutoAsync(vendedor.Id, preco: 25m, estoque: 10);

        await fixture.CarrinhoService.AdicionarItemAsync(
            comprador.Id,
            new CarrinhoAdicionarDto
            {
                ProdutoId = produto.Id,
                Quantidade = 3
            });

        var pedido = await fixture.PedidoService.CriarPedido(
            comprador.Id,
            new PedidoDto
            {
                EnderecoId = endereco.Id,
                TipoEntregaId = (int)TipoEntrega.EntregaLocal,
                Observacao = "Pedido gerado a partir do carrinho"
            });

        fixture.Context.ChangeTracker.Clear();

        var pedidoSalvo = await fixture.Context.TBL_PEDIDO
            .Include(p => p.Itens)
            .SingleAsync(p => p.Id == pedido.Id);

        var carrinho = await fixture.Context.TBL_CARRINHO
            .Include(c => c.Itens)
            .SingleAsync(c => c.UsuarioId == comprador.Id);

        Assert.Equal(StatusPedido.Pendente, pedidoSalvo.StatusPedidosId);
        Assert.Equal(75m, pedidoSalvo.ValorTotalPedido);
        Assert.Equal(5.25m, pedidoSalvo.ValorComissao);
        Assert.Equal(69.75m, pedidoSalvo.ValorLiquidoVendedor);
        Assert.Single(pedidoSalvo.Itens);
        Assert.Equal(3, pedidoSalvo.Itens[0].Quantidade);
        Assert.Empty(carrinho.Itens);
    }

    [Fact]
    public async Task CriarPedido_DeveBloquearCompraDoProprioProdutoMesmoComLojaVinculada()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("dono-da-loja");
        await fixture.CriarLojaAsync(usuario.Id, nomeFantasia: "Loja do Carlos");
        var endereco = await fixture.CriarEnderecoAsync(usuario.Id);
        var produto = await fixture.CriarProdutoAsync(usuario.Id, preco: 90m, estoque: 4);

        var excecao = await Assert.ThrowsAsync<Exception>(() => fixture.PedidoService.CriarPedido(
            usuario.Id,
            new PedidoDto
            {
                EnderecoId = endereco.Id,
                TipoEntregaId = (int)TipoEntrega.Retirada,
                Itens =
                [
                    new ItemPedidoDto
                    {
                        ProdutoId = produto.Id,
                        Quantidade = 1
                    }
                ]
            }));

        Assert.Equal($"Voce nao pode comprar o proprio produto {produto.Id}.", excecao.Message);
    }

    [Fact]
    public async Task CancelarPedido_DeveRestaurarEstoqueEEstornarFluxoFinanceiro()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync(quantidade: 2, preco: 40m, estoque: 10);

        var cancelado = await fixture.PedidoService.CancelarPedido(scenario.PedidoId, scenario.CompradorId);

        fixture.Context.ChangeTracker.Clear();

        var pedido = await fixture.Context.TBL_PEDIDO
            .SingleAsync(p => p.Id == scenario.PedidoId);

        var produto = await fixture.Context.TBL_PRODUTO
            .SingleAsync(p => p.Id == scenario.ProdutoId);

        var plano = await fixture.Context.TBL_PLANO_PAGAMENTO
            .SingleAsync(p => p.Id == scenario.PlanoPagamentoId);

        var venda = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId);

        Assert.True(cancelado);
        Assert.Equal(StatusPedido.Cancelado, pedido.StatusPedidosId);
        Assert.Equal(10, produto.Estoque);
        Assert.Equal(StatusPagamento.Estornado, plano.StatusPagamento);
        Assert.Equal(StatusVenda.Cancelada, venda.StatusVenda);
    }

    [Fact]
    public async Task MarcarPedidoComoEnviadoEConfirmarEntrega_DevemAtualizarPedidoEVenda()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();

        var pedidoAntesDoEnvio = await fixture.PedidoService.BuscarPedido(scenario.PedidoId, scenario.CompradorId);
        Assert.NotNull(pedidoAntesDoEnvio);
        Assert.False(pedidoAntesDoEnvio!.PodeConfirmarRecebimento);

        var pedidoEnviado = await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);
        Assert.NotNull(pedidoEnviado);
        Assert.Equal(StatusPedido.Enviado, pedidoEnviado!.StatusPedidosId);

        var pedidoAguardandoRecebimento = await fixture.PedidoService.BuscarPedido(
            scenario.PedidoId,
            scenario.CompradorId);

        Assert.NotNull(pedidoAguardandoRecebimento);
        Assert.True(pedidoAguardandoRecebimento!.PodeConfirmarRecebimento);
        Assert.False(pedidoAguardandoRecebimento.PossuiSolicitacaoCancelamentoAtiva);

        fixture.Context.ChangeTracker.Clear();

        var vendaEnviada = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId);

        Assert.Equal(StatusVenda.Enviada, vendaEnviada.StatusVenda);

        var pedidoEntregue = await fixture.PedidoService.ConfirmarEntregaPedidoAsync(
            scenario.PedidoId,
            scenario.CompradorId);

        Assert.NotNull(pedidoEntregue);
        Assert.Equal(StatusPedido.Entregue, pedidoEntregue!.StatusPedidosId);

        fixture.Context.ChangeTracker.Clear();

        var pedidoAtualizado = await fixture.Context.TBL_PEDIDO
            .SingleAsync(p => p.Id == scenario.PedidoId);

        var vendaConcluida = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId);

        Assert.Equal(StatusPedido.Entregue, pedidoAtualizado.StatusPedidosId);
        Assert.Equal(StatusVenda.Concluida, vendaConcluida.StatusVenda);
    }

    [Fact]
    public async Task ConfirmarEntregaPedidoAsync_DeveBloquearQuandoHouverSolicitacaoCancelamentoAtiva()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();

        await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);

        await fixture.SolicitacaoCancelamentoService.CriarAsync(
            scenario.PedidoId,
            scenario.CompradorId,
            new SolicitacaoCancelamentoCriacaoDto
            {
                TipoSolicitacao = TipoSolicitacaoPedido.ProblemaEntrega,
                Motivo = MotivoSolicitacaoCancelamento.EntregaNaoRecebida
            });

        var pedido = await fixture.PedidoService.BuscarPedido(scenario.PedidoId, scenario.CompradorId);
        Assert.NotNull(pedido);
        Assert.False(pedido!.PodeConfirmarRecebimento);
        Assert.True(pedido.PossuiSolicitacaoCancelamentoAtiva);

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.PedidoService.ConfirmarEntregaPedidoAsync(scenario.PedidoId, scenario.CompradorId));

        Assert.Equal(
            "Existe uma solicitacao ativa para este pedido. Resolva a tratativa antes de confirmar o recebimento.",
            excecao.Message);
    }

    [Fact]
    public async Task CancelarPedido_DeveFalharQuandoPedidoJaFoiEnviado()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();

        await fixture.PedidoService.MarcarPedidoComoEnviadoAsync(scenario.PedidoId);

        var excecao = await Assert.ThrowsAsync<Exception>(() =>
            fixture.PedidoService.CancelarPedido(scenario.PedidoId, scenario.CompradorId));

        Assert.Equal(
            "Pedido enviado nao pode ser cancelado diretamente pelo cliente. Abra uma solicitacao do pedido para tratar cancelamento, devolucao, troca ou problema de entrega.",
            excecao.Message);
    }

    [Fact]
    public async Task BuscarPedido_DeveRetornarDtoComEnderecoEItens()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPendenteAsync(quantidade: 2, preco: 25m, estoque: 10);

        var pedido = await fixture.PedidoService.BuscarPedido(scenario.PedidoId, scenario.CompradorId);

        Assert.NotNull(pedido);
        Assert.Equal(scenario.PedidoId, pedido!.Id);
        Assert.Equal("Entrega local", pedido.TipoEntrega);
        Assert.Equal("Sao Paulo", pedido.CidadeEntrega);
        Assert.Equal("SP", pedido.UfEntrega);
        Assert.Single(pedido.Itens);
        Assert.Equal(scenario.ProdutoId, pedido.Itens[0].ProdutoId);
        Assert.Equal(2, pedido.Itens[0].Quantidade);
        Assert.False(string.IsNullOrWhiteSpace(pedido.Itens[0].NomeProduto));
        Assert.False(string.IsNullOrWhiteSpace(pedido.Itens[0].NomeLoja));
    }

    [Fact]
    public async Task CancelamentoPelaLoja_DeveAparecerComoCanceladoParaOComprador()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        var pedidoLoja = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Cancelada);

        Assert.NotNull(pedidoLoja);
        Assert.Equal(StatusPedido.Cancelado, pedidoLoja!.StatusPedido);

        var pedidoComprador = await fixture.PedidoService.BuscarPedido(
            scenario.PedidoId,
            scenario.CompradorId);

        Assert.NotNull(pedidoComprador);
        Assert.Equal(StatusPedido.Cancelado, pedidoComprador!.Status);
        Assert.False(pedidoComprador.PodeConfirmarRecebimento);

        var pedidosDoComprador = await fixture.PedidoService.ListarPedidosUsuario(scenario.CompradorId);
        var pedidoListado = Assert.Single(pedidosDoComprador);

        Assert.Equal(scenario.PedidoId, pedidoListado.Id);
        Assert.Equal(StatusPedido.Cancelado, pedidoListado.Status);
        Assert.False(pedidoListado.PodeConfirmarRecebimento);
    }

    [Fact]
    public async Task ListarPedidosDaLoja_DeveRetornarPedidoPendenteMesmoSemVendaCriada()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPendenteAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        var pedidos = await fixture.PedidoService.ListarPedidosDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            busca: null,
            statusPedido: null,
            statusVenda: null,
            page: 1,
            pageSize: 20);

        var pedido = Assert.Single(pedidos.Items);
        Assert.Equal(scenario.PedidoId, pedido.PedidoId);
        Assert.Null(pedido.VendaId);
        Assert.Null(pedido.StatusVenda);
        Assert.Equal(StatusPedido.Pendente, pedido.StatusPedido);
        Assert.True(pedido.PodeCancelar);
        Assert.False(pedido.PodeAceitar);
        Assert.False(pedido.PodeMarcarComoPronto);
        Assert.False(pedido.PodeMarcarComoEnviado);
    }

    [Fact]
    public async Task ListarPedidosDaLoja_DeveFiltrarItensDaLojaEmPedidoMultiloja()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoMultilojaAsync();

        var pedidos = await fixture.PedidoService.ListarPedidosDaLojaAsync(
            scenario.LojaAId,
            scenario.VendedorAId,
            busca: null,
            statusPedido: null,
            statusVenda: null,
            page: 1,
            pageSize: 20);

        var pedido = Assert.Single(pedidos.Items);
        var item = Assert.Single(pedido.Itens);

        Assert.Equal(scenario.PedidoId, pedido.PedidoId);
        Assert.Equal(StatusPedido.Pago, pedido.StatusPedido);
        Assert.Equal(StatusVenda.Pendente, pedido.StatusVenda);
        Assert.Equal(scenario.ProdutoAId, item.ProdutoId);
        Assert.Equal(scenario.QuantidadeProdutoA, item.Quantidade);
        Assert.Equal(50m, pedido.ValorTotalLoja);
        Assert.True(pedido.PedidoMultiloja);
        Assert.False(pedido.PodeCancelar);
        Assert.True(pedido.PodeAceitar);
        Assert.False(pedido.PodeMarcarComoPronto);
        Assert.False(pedido.PodeMarcarComoEnviado);
    }

    [Fact]
    public async Task ListarPedidosDaLoja_DeveBloquearEnvioQuandoVendaLegadaAindaEstiverComoPaga()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        var venda = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId);

        venda.StatusVenda = StatusVenda.Paga;
        await fixture.Context.SaveChangesAsync();
        fixture.Context.ChangeTracker.Clear();

        var pedidos = await fixture.PedidoService.ListarPedidosDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            busca: null,
            statusPedido: null,
            statusVenda: null,
            page: 1,
            pageSize: 20);

        var pedido = Assert.Single(pedidos.Items);

        Assert.Equal(StatusVenda.Pendente, pedido.StatusVenda);
        Assert.True(pedido.PodeAceitar);
        Assert.False(pedido.PodeMarcarComoPronto);
        Assert.False(pedido.PodeMarcarComoEnviado);
    }

    [Fact]
    public async Task AtualizarStatusPedidoDaLoja_DeveAvancarFluxoOperacionalDaLojaPassoAPasso()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        var pedidoEmSeparacao = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.EmSeparacao);

        Assert.NotNull(pedidoEmSeparacao);
        Assert.Equal(StatusVenda.EmSeparacao, pedidoEmSeparacao!.StatusVenda);
        Assert.True(pedidoEmSeparacao.PodeMarcarComoPronto);
        Assert.False(pedidoEmSeparacao.PodeMarcarComoEnviado);

        var pedidoPronto = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Pronto);

        Assert.NotNull(pedidoPronto);
        Assert.Equal(StatusVenda.Pronto, pedidoPronto!.StatusVenda);
        Assert.False(pedidoPronto.PodeMarcarComoPronto);
        Assert.True(pedidoPronto.PodeMarcarComoEnviado);

        var pedidoEnviado = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Enviada);

        Assert.NotNull(pedidoEnviado);
        Assert.Equal(StatusVenda.Enviada, pedidoEnviado!.StatusVenda);
        Assert.Equal(StatusPedido.Enviado, pedidoEnviado.StatusPedido);

        fixture.Context.ChangeTracker.Clear();

        var venda = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId);
        var pedido = await fixture.Context.TBL_PEDIDO
            .SingleAsync(p => p.Id == scenario.PedidoId);

        Assert.Equal(StatusVenda.Enviada, venda.StatusVenda);
        Assert.Equal(StatusPedido.Enviado, pedido.StatusPedidosId);
    }

    [Fact]
    public async Task BuscarPedidoDaLoja_DeveIndicarQuandoAguardaConfirmacaoDeRecebimento()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.EmSeparacao);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Pronto);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Enviada);

        var pedidoLoja = await fixture.PedidoService.BuscarPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId);

        Assert.NotNull(pedidoLoja);
        Assert.True(pedidoLoja!.AguardandoConfirmacaoRecebimento);
        Assert.False(pedidoLoja.PossuiSolicitacaoCancelamentoAtiva);
    }

    [Fact]
    public async Task BuscarPedidoDaLoja_DeveIndicarSolicitacaoCancelamentoAtivaQuandoCompradorAbrirTratativa()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.EmSeparacao);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Pronto);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Enviada);

        await fixture.SolicitacaoCancelamentoService.CriarAsync(
            scenario.PedidoId,
            scenario.CompradorId,
            new SolicitacaoCancelamentoCriacaoDto
            {
                TipoSolicitacao = TipoSolicitacaoPedido.ProblemaEntrega,
                Motivo = MotivoSolicitacaoCancelamento.EntregaNaoRecebida,
                Observacao = "Cliente iniciou tratativa com a loja."
            });

        var pedidoLoja = await fixture.PedidoService.BuscarPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId);

        Assert.NotNull(pedidoLoja);
        Assert.True(pedidoLoja!.PossuiSolicitacaoCancelamentoAtiva);
        Assert.False(pedidoLoja.AguardandoConfirmacaoRecebimento);
    }

    [Fact]
    public async Task AtualizarStatusPedidoDaLoja_DeveManterPedidoPagoAteTodasAsVendasSeremEnviadas()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoMultilojaAsync();

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            scenario.LojaAId,
            scenario.VendedorAId,
            scenario.PedidoId,
            StatusVenda.EmSeparacao);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            scenario.LojaAId,
            scenario.VendedorAId,
            scenario.PedidoId,
            StatusVenda.Pronto);

        var pedidoLojaA = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            scenario.LojaAId,
            scenario.VendedorAId,
            scenario.PedidoId,
            StatusVenda.Enviada);

        Assert.NotNull(pedidoLojaA);
        Assert.Equal(StatusVenda.Enviada, pedidoLojaA!.StatusVenda);
        Assert.Equal(StatusPedido.Pago, pedidoLojaA.StatusPedido);

        fixture.Context.ChangeTracker.Clear();

        var vendaLojaA = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId && v.VendedorId == scenario.VendedorAId);
        var vendaLojaB = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId && v.VendedorId == scenario.VendedorBId);
        var pedidoAposPrimeiroEnvio = await fixture.Context.TBL_PEDIDO
            .SingleAsync(p => p.Id == scenario.PedidoId);

        Assert.Equal(StatusVenda.Enviada, vendaLojaA.StatusVenda);
        Assert.Equal(StatusVenda.Pendente, vendaLojaB.StatusVenda);
        Assert.Equal(StatusPedido.Pago, pedidoAposPrimeiroEnvio.StatusPedidosId);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            scenario.LojaBId,
            scenario.VendedorBId,
            scenario.PedidoId,
            StatusVenda.EmSeparacao);

        await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            scenario.LojaBId,
            scenario.VendedorBId,
            scenario.PedidoId,
            StatusVenda.Pronto);

        var pedidoLojaB = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            scenario.LojaBId,
            scenario.VendedorBId,
            scenario.PedidoId,
            StatusVenda.Enviada);

        Assert.NotNull(pedidoLojaB);
        Assert.Equal(StatusPedido.Enviado, pedidoLojaB!.StatusPedido);

        fixture.Context.ChangeTracker.Clear();

        var pedidoEnviado = await fixture.Context.TBL_PEDIDO
            .SingleAsync(p => p.Id == scenario.PedidoId);

        Assert.Equal(StatusPedido.Enviado, pedidoEnviado.StatusPedidosId);
    }

    [Fact]
    public async Task AtualizarStatusPedidoDaLoja_DeveBloquearEnvioAntesDoPedidoEstarPronto()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
                lojaId,
                scenario.VendedorId,
                scenario.PedidoId,
                StatusVenda.Enviada));

        Assert.Equal("Somente pedidos prontos podem seguir para envio pela loja.", excecao.Message);
    }

    [Fact]
    public async Task AtualizarStatusPedidoDaLoja_DeveCancelarPedidoMonolojaEEstornarFluxoFinanceiro()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoAsync();
        var lojaId = await fixture.Context.TBL_LOJA
            .Where(l => l.UsuarioId == scenario.VendedorId)
            .Select(l => l.Id)
            .SingleAsync();

        var pedido = await fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
            lojaId,
            scenario.VendedorId,
            scenario.PedidoId,
            StatusVenda.Cancelada);

        Assert.NotNull(pedido);
        Assert.Equal(StatusPedido.Cancelado, pedido!.StatusPedido);
        Assert.Equal(StatusVenda.Cancelada, pedido.StatusVenda);

        fixture.Context.ChangeTracker.Clear();

        var pedidoCancelado = await fixture.Context.TBL_PEDIDO
            .SingleAsync(p => p.Id == scenario.PedidoId);
        var vendaCancelada = await fixture.Context.TBL_VENDA
            .SingleAsync(v => v.PedidoId == scenario.PedidoId);
        var planoEstornado = await fixture.Context.TBL_PLANO_PAGAMENTO
            .SingleAsync(p => p.Id == scenario.PlanoPagamentoId);
        var produto = await fixture.Context.TBL_PRODUTO
            .SingleAsync(p => p.Id == scenario.ProdutoId);

        Assert.Equal(StatusPedido.Cancelado, pedidoCancelado.StatusPedidosId);
        Assert.Equal(StatusVenda.Cancelada, vendaCancelada.StatusVenda);
        Assert.Equal(StatusPagamento.Estornado, planoEstornado.StatusPagamento);
        Assert.Equal(scenario.EstoqueInicial, produto.Estoque);
    }

    [Fact]
    public async Task AtualizarStatusPedidoDaLoja_DeveBloquearCancelamentoDePedidoMultiloja()
    {
        using var fixture = new ServiceTestFixture();
        var scenario = await fixture.CriarPedidoPagoMultilojaAsync();

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.PedidoService.AtualizarStatusPedidoDaLojaAsync(
                scenario.LojaAId,
                scenario.VendedorAId,
                scenario.PedidoId,
                StatusVenda.Cancelada));

        Assert.Equal(
            "Cancelamento pela loja ainda nao esta disponivel para pedidos com itens de outras lojas.",
            excecao.Message);
    }
}
