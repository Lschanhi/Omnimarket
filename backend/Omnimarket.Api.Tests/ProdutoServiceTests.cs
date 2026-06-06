using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class ProdutoServiceTests
{
    [Fact]
    public async Task CreateAsync_DeveExigirLojaAntesDeCadastrarProduto()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("vendedor-sem-loja");

        var excecao = await Assert.ThrowsAsync<Exception>(() => fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Mouse Gamer",
                Categoria = "Perifericos",
                Preco = 129.90m,
                Estoque = 5,
                Descricao = "Produto de teste"
            },
            usuario.Id));

        Assert.Equal("Crie uma loja antes de cadastrar produtos.", excecao.Message);
    }

    [Fact]
    public async Task CreateAsync_DeveVincularProdutoALojaERetornarDadosDaLoja()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("vendedor-com-loja");
        var loja = await fixture.CriarLojaAsync(usuario.Id, nomeFantasia: "Loja da Ana");

        var produto = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Teclado Mecanico",
                Categoria = "Perifericos",
                Preco = 249.90m,
                Estoque = 8,
                Descricao = "Produto de teste"
            },
            usuario.Id);

        fixture.Context.ChangeTracker.Clear();

        var produtoSalvo = await fixture.Context.TBL_PRODUTO
            .Include(p => p.Loja)
            .SingleAsync(p => p.Id == produto.Id);

        Assert.Equal(loja.Id, produtoSalvo.LojaId);
        Assert.Equal("Perifericos", produtoSalvo.Categoria);
        Assert.Equal(loja.NomeFantasia, produto.NomeLoja);
        Assert.Equal(loja.Id, produto.LojaId);
    }

    [Fact]
    public async Task CreateAsync_DeveExigirCategoriaParaProduto()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("seller-sem-categoria");
        await fixture.CriarLojaAsync(usuario.Id);

        var excecao = await Assert.ThrowsAsync<Exception>(() => fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Produto Sem Categoria",
                Preco = 99.90m,
                Estoque = 2
            },
            usuario.Id));

        Assert.Equal("Informe uma categoria valida para o produto.", excecao.Message);
    }

    [Fact]
    public async Task CreateAsync_DevePersistirCategoriaInformadaNoProduto()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("seller-categoria");
        await fixture.CriarLojaAsync(usuario.Id);

        var produto = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Camiseta Basic",
                Categoria = "Camisetas",
                Preco = 59.90m,
                Estoque = 7,
                Descricao = "Produto simples"
            },
            usuario.Id);

        var produtoSalvo = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == produto.Id);

        Assert.Equal("Camisetas", produtoSalvo.Categoria);
        Assert.Equal("Camisetas", produto.Categoria);
    }

    [Fact]
    public async Task GetPagedAsync_DeveFiltrarPorNomeCategoriaEPreco()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("seller-discovery");
        await fixture.CriarLojaAsync(usuario.Id, nomeFantasia: "Tech Center");

        var notebookPro = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Notebook Pro",
                Categoria = "Notebooks",
                Preco = 5200m,
                Estoque = 3,
                Descricao = "Modelo premium"
            },
            usuario.Id);

        _ = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Notebook Lite",
                Categoria = "Notebooks",
                Preco = 3100m,
                Estoque = 5,
                Descricao = "Linha de entrada"
            },
            usuario.Id);

        var resultado = await fixture.ProdutoService.GetPagedAsync(new ProdutoFiltroDto
        {
            Nome = "Notebook Pro",
            Categoria = "Notebooks",
            PrecoMinimo = 5000m,
            PrecoMaximo = 5300m
        });

        Assert.Single(resultado.Items);
        Assert.Equal(notebookPro.Id, resultado.Items.Single().Id);
        Assert.Equal(5200m, resultado.Items.Single().Preco);
    }

    [Fact]
    public async Task CreateAsync_DevePermitirMesmoNomeEmLojasDiferentes()
    {
        using var fixture = new ServiceTestFixture();
        var vendedorA = await fixture.CriarUsuarioAsync("seller-a");
        var vendedorB = await fixture.CriarUsuarioAsync("seller-b");

        await fixture.CriarLojaAsync(vendedorA.Id, nomeFantasia: "Loja A");
        await fixture.CriarLojaAsync(vendedorB.Id, nomeFantasia: "Loja B");

        var produtoA = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Camiseta Basica",
                Categoria = "Roupas",
                Preco = 49.90m,
                Estoque = 5
            },
            vendedorA.Id);

        var produtoB = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Camiseta Basica",
                Categoria = "Roupas",
                Preco = 59.90m,
                Estoque = 3
            },
            vendedorB.Id);

        Assert.NotEqual(produtoA.LojaId, produtoB.LojaId);
        Assert.Equal("Camiseta Basica", produtoA.Nome);
        Assert.Equal("Camiseta Basica", produtoB.Nome);
    }

    [Fact]
    public async Task UpdateAsync_DeveAlterarApenasPrecoEDescricaoNoEditarComum()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-update");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id, preco: 50m, estoque: 10);

        var atualizado = await fixture.ProdutoService.UpdateAsync(
            produto.Id,
            new ProdutoAtualizarDto
            {
                Preco = 79.90m,
                Descricao = "Descricao revisada"
            },
            vendedor.Id);

        fixture.Context.ChangeTracker.Clear();

        var produtoSalvo = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == produto.Id);
        var historico = await fixture.Context.TBL_HISTORICO_PRODUTO.SingleAsync(h => h.ProdutoId == produto.Id);

        Assert.True(atualizado);
        Assert.Equal(produto.Nome, produtoSalvo.Nome);
        Assert.Equal(produto.Categoria, produtoSalvo.Categoria);
        Assert.Equal(79.90m, produtoSalvo.Preco);
        Assert.Equal(10, produtoSalvo.Estoque);
        Assert.Equal("Descricao revisada", produtoSalvo.Descricao);
        Assert.Equal(StatusProduto.Publicado, produtoSalvo.StatusPublicacao);

        Assert.Equal("EdicaoDados", historico.TipoAlteracao);
        Assert.Equal(produto.LojaId, historico.LojaId);
        Assert.Equal(vendedor.Id, historico.UsuarioResponsavelId);
        Assert.Equal(50m, historico.PrecoAnterior);
        Assert.Equal(79.90m, historico.PrecoNovo);
        Assert.Equal("Produto usado para teste automatizado.", historico.DescricaoAnterior);
        Assert.Equal("Descricao revisada", historico.DescricaoNova);
        Assert.Null(historico.EstoqueAnterior);
        Assert.Null(historico.EstoqueNovo);
    }

    [Fact]
    public async Task UpdateAsync_DevePersistirCamposDoFormularioEPausarProdutoQuandoDisponivelForFalse()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-update-form");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id, preco: 50m, estoque: 10);

        var atualizado = await fixture.ProdutoService.UpdateAsync(
            produto.Id,
            new ProdutoAtualizarDto
            {
                Nome = "Mousse de Limao",
                Categoria = "Doces",
                Preco = 10.90m,
                Estoque = 7,
                Disponivel = false,
                Descricao = "Sobremesa gelada"
            },
            vendedor.Id);

        fixture.Context.ChangeTracker.Clear();

        var produtoSalvo = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == produto.Id);
        var historico = await fixture.Context.TBL_HISTORICO_PRODUTO.SingleAsync(h => h.ProdutoId == produto.Id);
        var produtosPublicados = await fixture.ProdutoService.GetAllAsync();

        Assert.True(atualizado);
        Assert.Equal("Mousse de Limao", produtoSalvo.Nome);
        Assert.Equal("Doces", produtoSalvo.Categoria);
        Assert.Equal(10.90m, produtoSalvo.Preco);
        Assert.Equal(7, produtoSalvo.Estoque);
        Assert.Equal("Sobremesa gelada", produtoSalvo.Descricao);
        Assert.Equal(StatusProduto.Pausado, produtoSalvo.StatusPublicacao);
        Assert.False(produtoSalvo.Disponivel);
        Assert.DoesNotContain(produtosPublicados, p => p.Id == produto.Id);

        Assert.Equal("EdicaoDados", historico.TipoAlteracao);
        Assert.Equal(50m, historico.PrecoAnterior);
        Assert.Equal(10.90m, historico.PrecoNovo);
        Assert.Equal(10, historico.EstoqueAnterior);
        Assert.Equal(7, historico.EstoqueNovo);
        Assert.Equal("Produto usado para teste automatizado.", historico.DescricaoAnterior);
        Assert.Equal("Sobremesa gelada", historico.DescricaoNova);
    }

    [Fact]
    public async Task AtualizarEstoqueAsync_DeveRegistrarHistoricoSeparado()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-stock");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id, preco: 50m, estoque: 10);

        var atualizado = await fixture.ProdutoService.AtualizarEstoqueAsync(
            produto.Id,
            new ProdutoAtualizarEstoqueDto
            {
                Estoque = 4
            },
            vendedor.Id);

        fixture.Context.ChangeTracker.Clear();

        var produtoSalvo = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == produto.Id);
        var historico = await fixture.Context.TBL_HISTORICO_PRODUTO.SingleAsync(h => h.ProdutoId == produto.Id);

        Assert.True(atualizado);
        Assert.Equal(4, produtoSalvo.Estoque);
        Assert.Equal("AtualizacaoEstoque", historico.TipoAlteracao);
        Assert.Equal(10, historico.EstoqueAnterior);
        Assert.Equal(4, historico.EstoqueNovo);
        Assert.Null(historico.PrecoAnterior);
        Assert.Null(historico.PrecoNovo);
    }

    [Fact]
    public async Task DeleteAsync_DeveFazerExclusaoLogicaERegistrarHistorico()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-delete");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id, preco: 50m, estoque: 10);

        var removido = await fixture.ProdutoService.DeleteAsync(produto.Id, vendedor.Id);

        fixture.Context.ChangeTracker.Clear();

        var produtoSalvo = await fixture.Context.TBL_PRODUTO.SingleAsync(p => p.Id == produto.Id);
        var historico = await fixture.Context.TBL_HISTORICO_PRODUTO.SingleAsync(h => h.ProdutoId == produto.Id);

        Assert.True(removido);
        Assert.Equal(StatusProduto.Desativado, produtoSalvo.StatusPublicacao);
        Assert.Equal("DesativacaoLogica", historico.TipoAlteracao);
        Assert.Equal(50m, historico.PrecoAnterior);
        Assert.Equal(50m, historico.PrecoNovo);
        Assert.Equal(10, historico.EstoqueAnterior);
        Assert.Equal(10, historico.EstoqueNovo);
        Assert.Equal("Produto usado para teste automatizado.", historico.DescricaoAnterior);
        Assert.Equal("Produto usado para teste automatizado.", historico.DescricaoNova);
    }

    [Fact]
    public async Task DeleteCategoryAsync_DeveExigirConfirmacaoQuandoHouverProdutosAtivos()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-category-confirm");
        await fixture.CriarProdutoAsync(vendedor.Id, preco: 30m, estoque: 2);
        await fixture.CriarProdutoAsync(vendedor.Id, preco: 40m, estoque: 4);

        var resultado = await fixture.ProdutoService.DeleteCategoryAsync("Teste", vendedor.Id, confirmarExclusaoProdutos: false);

        fixture.Context.ChangeTracker.Clear();

        var produtosAtivos = await fixture.Context.TBL_PRODUTO
            .Where(p => p.Loja.UsuarioId == vendedor.Id)
            .Select(p => p.StatusPublicacao)
            .ToListAsync();

        Assert.True(resultado.RequerConfirmacao);
        Assert.Equal(2, resultado.TotalProdutosEncontrados);
        Assert.Equal(0, resultado.TotalProdutosDesativados);
        Assert.All(produtosAtivos, status => Assert.Equal(StatusProduto.Publicado, status));
        Assert.Empty(await fixture.Context.TBL_HISTORICO_PRODUTO.ToListAsync());
    }

    [Fact]
    public async Task DeleteCategoryAsync_DeveDesativarTodosOsProdutosDaCategoriaERegistrarHistorico()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-category-delete");
        var produtoA = await fixture.CriarProdutoAsync(vendedor.Id, preco: 30m, estoque: 2);
        var produtoB = await fixture.CriarProdutoAsync(vendedor.Id, preco: 40m, estoque: 4);
        var produtoOutraCategoria = await fixture.CriarProdutoAsync(vendedor.Id, preco: 55m, estoque: 5);

        produtoOutraCategoria.Categoria = "Outra";
        await fixture.Context.SaveChangesAsync();

        var resultado = await fixture.ProdutoService.DeleteCategoryAsync("teste", vendedor.Id, confirmarExclusaoProdutos: true);

        fixture.Context.ChangeTracker.Clear();

        var produtos = await fixture.Context.TBL_PRODUTO
            .Where(p => p.Loja.UsuarioId == vendedor.Id)
            .OrderBy(p => p.Id)
            .ToListAsync();
        var historicos = await fixture.Context.TBL_HISTORICO_PRODUTO
            .Where(h => h.LojaId == produtos[0].LojaId)
            .OrderBy(h => h.ProdutoId)
            .ToListAsync();

        Assert.False(resultado.RequerConfirmacao);
        Assert.Equal(2, resultado.TotalProdutosEncontrados);
        Assert.Equal(2, resultado.TotalProdutosDesativados);
        Assert.Equal(StatusProduto.Desativado, produtos.Single(p => p.Id == produtoA.Id).StatusPublicacao);
        Assert.Equal(StatusProduto.Desativado, produtos.Single(p => p.Id == produtoB.Id).StatusPublicacao);
        Assert.Equal(StatusProduto.Publicado, produtos.Single(p => p.Id == produtoOutraCategoria.Id).StatusPublicacao);
        Assert.Equal(2, historicos.Count);
        Assert.All(historicos, historico => Assert.Equal("DesativacaoCategoria", historico.TipoAlteracao));
    }
}
