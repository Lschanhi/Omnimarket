using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class UsuarioPerfilServiceTests
{
    [Fact]
    public async Task AtualizarAsync_DeveImpedirEmailDuplicado()
    {
        using var fixture = new ServiceTestFixture();
        var usuario1 = await fixture.CriarUsuarioAsync("usuario-perfil-1");
        var usuario2 = await fixture.CriarUsuarioAsync("usuario-perfil-2");

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.UsuarioPerfilService.AtualizarAsync(
            usuario1.Id,
            new UsuarioAtualizarDto
            {
                Nome = usuario1.Nome,
                Sobrenome = usuario1.Sobrenome,
                Email = usuario2.Email
            }));

        Assert.Equal("Email ja esta em uso.", excecao.Message);
    }

    [Fact]
    public async Task AtualizarFotoPerfilAsync_DevePersistirFotoEmTabelaDedicadaEExporNoPerfil()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("usuario-com-foto");
        var dataUrl = $"data:image/png;base64,{Convert.ToBase64String(new byte[] { 1, 2, 3, 4 })}";

        var fotoPerfil = await fixture.UsuarioPerfilService.AtualizarFotoPerfilAsync(
            usuario.Id,
            new UsuarioFotoPerfilAtualizarDto
            {
                DataUrl = dataUrl,
                NomeArquivo = "avatar.png"
            });

        Assert.StartsWith("https://storage.test/foto-perfil-test/usuarios/", fotoPerfil.AvatarUrl);
        Assert.Equal("avatar.png", fotoPerfil.NomeArquivo);

        var perfil = await fixture.UsuarioPerfilService.ObterPerfilAsync(usuario.Id);

        Assert.NotNull(perfil);
        Assert.Equal(fotoPerfil.AvatarUrl, perfil!.AvatarUrl);
        Assert.Single(fixture.Context.TBL_USUARIO_FOTO_PERFIL);
        Assert.Equal(Array.Empty<byte>(), fixture.Context.TBL_USUARIO_FOTO_PERFIL.Single().Conteudo);
    }

    [Fact]
    public async Task AtualizarFotoPerfilAsync_ComArquivoUrl_DevePersistirSomenteAReferencia()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("usuario-com-url");
        var urlBlob = await fixture.ArquivoStorageService.SalvarAsync(
            "foto-perfil-test",
            $"usuarios/{usuario.Id}/perfil",
            "avatar-uploadado.png",
            "image/png",
            new MemoryStream([1, 2, 3, 4]));

        var fotoPerfil = await fixture.UsuarioPerfilService.AtualizarFotoPerfilAsync(
            usuario.Id,
            new UsuarioFotoPerfilAtualizarDto
            {
                ArquivoUrl = urlBlob,
                NomeArquivo = "avatar-uploadado.png",
                MimeType = "image/png"
            });

        Assert.Equal(urlBlob, fotoPerfil.AvatarUrl);
        Assert.Equal("avatar-uploadado.png", fotoPerfil.NomeArquivo);
        Assert.Single(fixture.ArquivoStorageService.ArquivosSalvos);
    }

    [Fact]
    public async Task RemoverFotoPerfilAsync_DeveExcluirRegistroDaFoto()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("usuario-remove-foto");

        await fixture.UsuarioPerfilService.AtualizarFotoPerfilAsync(
            usuario.Id,
            new UsuarioFotoPerfilAtualizarDto
            {
                DataUrl = $"data:image/webp;base64,{Convert.ToBase64String(new byte[] { 9, 8, 7 })}",
                NomeArquivo = "avatar.webp"
            });

        var removida = await fixture.UsuarioPerfilService.RemoverFotoPerfilAsync(usuario.Id);

        Assert.True(removida);
        Assert.Empty(fixture.Context.TBL_USUARIO_FOTO_PERFIL);
        Assert.Single(fixture.ArquivoStorageService.ArquivosRemovidos);
    }

    [Fact]
    public async Task ObterFotoPerfilAsync_DeveIgnorarRegistroLegadoSemUrlBlob()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("usuario-legado-sem-url");

        fixture.Context.TBL_USUARIO_FOTO_PERFIL.Add(new UsuarioFotoPerfil
        {
            UsuarioId = usuario.Id,
            MimeType = "image/png",
            NomeArquivo = "avatar-legado.png",
            Url = string.Empty,
            Conteudo = [1, 2, 3]
        });
        await fixture.Context.SaveChangesAsync();

        var fotoPerfil = await fixture.UsuarioPerfilService.ObterFotoPerfilAsync(usuario.Id);
        var perfil = await fixture.UsuarioPerfilService.ObterPerfilAsync(usuario.Id);

        Assert.Null(fotoPerfil);
        Assert.NotNull(perfil);
        Assert.Null(perfil!.AvatarUrl);
    }
}
