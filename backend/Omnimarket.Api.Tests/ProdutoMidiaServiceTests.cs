using System.Text;
using Microsoft.AspNetCore.Http;
using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class ProdutoMidiaServiceTests
{
    private const string FotoDataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+bB9sAAAAASUVORK5CYII=";

    private const string VideoDataUrl =
        "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAAAAGlzb21pc28yYXZjMQ==";

    [Fact]
    public async Task CreateAsync_DevePersistirMidiasNoBancoERetornarFotosEVideos()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-midias-create");
        await fixture.CriarLojaAsync(vendedor.Id);

        var produto = await fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Produto com Midias",
                Categoria = "Teste",
                Preco = 39.90m,
                Estoque = 4,
                Imagens = [FotoDataUrl, VideoDataUrl]
            },
            vendedor.Id);

        fixture.Context.ChangeTracker.Clear();

        var midiasSalvas = await fixture.Context.ProdutoMidia
            .Where(m => m.ProdutoId == produto.Id)
            .OrderBy(m => m.Ordem)
            .ToListAsync();

        Assert.Equal(2, midiasSalvas.Count);
        Assert.All(midiasSalvas, midia => Assert.Null(midia.Conteudo));
        Assert.Equal(TipoMidiaProduto.Foto, midiasSalvas[0].Tipo);
        Assert.Equal(TipoMidiaProduto.Video, midiasSalvas[1].Tipo);

        Assert.Single(produto.Imagens);
        Assert.StartsWith("https://storage.test/foto-produto-test/produtos/", produto.Imagens[0]);
        Assert.Equal(2, produto.Midias.Count);
        Assert.Contains(produto.Midias, midia => midia.Tipo == TipoMidiaProduto.Video && midia.Url.StartsWith("https://storage.test/videos-produto-test/produtos/"));
        Assert.Contains(produto.Midias, midia => midia.Tipo == TipoMidiaProduto.Foto && midia.Url.StartsWith("https://storage.test/foto-produto-test/produtos/"));
    }

    [Fact]
    public async Task UploadMidiasAsync_DeveSalvarArquivosNoBancoERetornarDataUrls()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-midias-upload");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id);

        var arquivos = new List<IFormFile>
        {
            CriarArquivo("foto.png", "image/png", [137, 80, 78, 71, 13, 10, 26, 10]),
            CriarArquivo("video.mp4", "video/mp4", Encoding.UTF8.GetBytes("video-teste"))
        };

        var resultado = await fixture.ProdutoMidiaService.UploadMidiasAsync(produto.Id, vendedor.Id, arquivos);

        fixture.Context.ChangeTracker.Clear();

        var midiasSalvas = await fixture.Context.ProdutoMidia
            .Where(m => m.ProdutoId == produto.Id)
            .OrderBy(m => m.Ordem)
            .ToListAsync();

        Assert.Equal(2, resultado.Count);
        Assert.Equal(2, midiasSalvas.Count);
        Assert.All(midiasSalvas, midia => Assert.Null(midia.Conteudo));
        Assert.Equal("foto.png", midiasSalvas[0].NomeArquivo);
        Assert.Equal("video.mp4", midiasSalvas[1].NomeArquivo);
        Assert.StartsWith("https://storage.test/foto-produto-test/produtos/", resultado[0].Url);
        Assert.StartsWith("https://storage.test/videos-produto-test/produtos/", resultado[1].Url);
    }

    [Fact]
    public async Task ObterCarrinhoAsync_DeveIgnorarFotoLegadaSemUrlBlob()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-midias-cart");
        var comprador = await fixture.CriarUsuarioAsync("buyer-midias-cart");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id, preco: 25m, estoque: 3);

        fixture.Context.ProdutoMidia.AddRange(
            new ProdutoMidia
            {
                ProdutoId = produto.Id,
                Tipo = TipoMidiaProduto.Video,
                Url = string.Empty,
                ContentType = "video/mp4",
                NomeArquivo = "video.mp4",
                Conteudo = Encoding.UTF8.GetBytes("video-principal"),
                Ordem = 0
            },
            new ProdutoMidia
            {
                ProdutoId = produto.Id,
                Tipo = TipoMidiaProduto.Foto,
                Url = string.Empty,
                ContentType = "image/png",
                NomeArquivo = "foto-principal.png",
                Conteudo = [137, 80, 78, 71, 13, 10, 26, 10],
                Ordem = 1
            });

        await fixture.Context.SaveChangesAsync();

        await fixture.CarrinhoService.AdicionarItemAsync(
            comprador.Id,
            new CarrinhoAdicionarDto
            {
                ProdutoId = produto.Id,
                Quantidade = 1
            });

        var carrinho = await fixture.CarrinhoService.ObterCarrinhoAsync(comprador.Id);

        Assert.Single(carrinho.Itens);
        Assert.True(string.IsNullOrWhiteSpace(carrinho.Itens[0].ImagemPrincipal));
    }

    [Fact]
    public async Task CreateAsync_DeveRecusarCaminhoRelativoLocalComoImagem()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("seller-midias-local-path");
        await fixture.CriarLojaAsync(vendedor.Id);

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.ProdutoService.CreateAsync(
            new ProdutoCriacaoDto
            {
                Nome = "Produto com caminho local",
                Categoria = "Teste",
                Preco = 19.90m,
                Estoque = 2,
                Imagens = ["/uploads/foto-legada.png"]
            },
            vendedor.Id));

        Assert.Equal(
            "Use uma URL absoluta publicada para a midia do produto ou envie o arquivo em data URL.",
            excecao.Message);
    }

    private static IFormFile CriarArquivo(string nomeArquivo, string contentType, byte[] conteudo)
    {
        var stream = new MemoryStream(conteudo);
        return new FormFile(stream, 0, conteudo.Length, "arquivos", nomeArquivo)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
