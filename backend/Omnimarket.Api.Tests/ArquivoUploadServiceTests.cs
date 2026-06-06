using System.Text;
using Microsoft.AspNetCore.Http;
using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class ArquivoUploadServiceTests
{
    [Fact]
    public async Task UploadFotoPerfilUsuarioAsync_DeveSalvarArquivoNoBlobERetornarMetadados()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("upload-avatar");

        var resultado = await fixture.ArquivoUploadService.UploadFotoPerfilUsuarioAsync(
            usuario.Id,
            CriarArquivo("avatar.png", "image/png", [137, 80, 78, 71, 13, 10, 26, 10]));

        Assert.StartsWith("https://storage.test/foto-perfil-test/usuarios/", resultado.Url);
        Assert.Equal("avatar.png", resultado.NomeArquivo);
        Assert.Equal("image/png", resultado.MimeType);
        Assert.Equal(8, resultado.TamanhoBytes);
        Assert.Single(fixture.ArquivoStorageService.ArquivosSalvos);
    }

    [Fact]
    public async Task UploadMidiasProdutoAsync_DeveSalvarArquivosSemPersistirRegistrosNoBanco()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("upload-midias");

        var resultado = await fixture.ArquivoUploadService.UploadMidiasProdutoAsync(
            vendedor.Id,
            [
                CriarArquivo("foto.png", "image/png", [137, 80, 78, 71, 13, 10, 26, 10]),
                CriarArquivo("video.mp4", "video/mp4", Encoding.UTF8.GetBytes("video-teste"))
            ]);

        Assert.Equal(2, resultado.Count);
        Assert.Contains(resultado, arquivo => arquivo.Url.StartsWith("https://storage.test/foto-produto-test/produtos/usuarios/"));
        Assert.Contains(resultado, arquivo => arquivo.Url.StartsWith("https://storage.test/videos-produto-test/produtos/usuarios/"));
        Assert.Empty(fixture.Context.ProdutoMidia);
    }

    private static IFormFile CriarArquivo(string nomeArquivo, string contentType, byte[] conteudo)
    {
        var stream = new MemoryStream(conteudo);
        return new FormFile(stream, 0, conteudo.Length, "arquivo", nomeArquivo)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
