using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class LegacyImageMigrationServiceTests
{
    [Fact]
    public async Task MigrarAsync_DeveMoverFotoPerfilUsuarioLegadaParaBlob()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("legacy-avatar");

        fixture.Context.TBL_USUARIO_FOTO_PERFIL.Add(new UsuarioFotoPerfil
        {
            UsuarioId = usuario.Id,
            MimeType = "image/png",
            NomeArquivo = "avatar-legado.png",
            Url = string.Empty,
            Conteudo = [1, 2, 3, 4]
        });
        await fixture.Context.SaveChangesAsync();

        var service = CriarService(fixture);
        var resultado = await service.MigrarAsync();

        var fotoSalva = await fixture.Context.TBL_USUARIO_FOTO_PERFIL.SingleAsync();

        Assert.Equal(1, resultado.FotosPerfilUsuarioMigradas);
        Assert.StartsWith("https://storage.test/foto-perfil-test/usuarios/", fotoSalva.Url);
        Assert.Empty(fotoSalva.Conteudo);
    }

    [Fact]
    public async Task MigrarAsync_DeveMoverMidiaProdutoLegadaParaBlob()
    {
        using var fixture = new ServiceTestFixture();
        var vendedor = await fixture.CriarUsuarioAsync("legacy-produto");
        var produto = await fixture.CriarProdutoAsync(vendedor.Id);

        fixture.Context.ProdutoMidia.Add(new ProdutoMidia
        {
            ProdutoId = produto.Id,
            Tipo = TipoMidiaProduto.Foto,
            Url = string.Empty,
            ContentType = "image/png",
            NomeArquivo = "foto-legada.png",
            Conteudo = [137, 80, 78, 71],
            Ordem = 0
        });
        await fixture.Context.SaveChangesAsync();

        var service = CriarService(fixture);
        var resultado = await service.MigrarAsync();

        var midiaSalva = await fixture.Context.ProdutoMidia.SingleAsync();

        Assert.Equal(1, resultado.MidiasProdutoMigradas);
        Assert.StartsWith("https://storage.test/foto-produto-test/produtos/", midiaSalva.Url);
        Assert.Null(midiaSalva.Conteudo);
    }

    [Fact]
    public async Task MigrarAsync_DeveMoverFotoPerfilLojaEmDataUrlParaBlob()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("legacy-loja");
        var loja = await fixture.CriarLojaAsync(usuario.Id);
        loja.FotoPerfilUrl = $"data:image/png;base64,{Convert.ToBase64String(new byte[] { 9, 8, 7, 6 })}";
        await fixture.Context.SaveChangesAsync();

        var service = CriarService(fixture);
        var resultado = await service.MigrarAsync();

        var lojaSalva = await fixture.Context.TBL_LOJA.SingleAsync();

        Assert.Equal(1, resultado.FotosPerfilLojaMigradas);
        Assert.StartsWith("https://storage.test/foto-perfil-loja-test/lojas/usuarios/", lojaSalva.FotoPerfilUrl);
    }

    private static LegacyImageMigrationService CriarService(ServiceTestFixture fixture)
    {
        var options = Options.Create(new AzureBlobStorageOptions
        {
            ConnectionString = "UseDevelopmentStorage=true",
            FotoPerfilContainerName = "foto-perfil-test",
            FotoProdutoContainerName = "foto-produto-test",
            VideoProdutoContainerName = "videos-produto-test",
            FotoPerfilLojaContainerName = "foto-perfil-loja-test"
        });

        return new LegacyImageMigrationService(
            fixture.Context,
            fixture.ArquivoStorageService,
            options,
            new FakeWebHostEnvironment(),
            NullLogger<LegacyImageMigrationService>.Instance);
    }

    private sealed class FakeWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "Omnimarket.Api.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = Path.Combine(Path.GetTempPath(), "omnimarket-tests-wwwroot");
        public string EnvironmentName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
