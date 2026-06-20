using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class PasswordResetServiceTests
{
    [Fact]
    public async Task SolicitarRedefinicaoAsync_DeveGerarTokenEPersistirDados()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("reset");

        await fixture.PasswordResetService.SolicitarRedefinicaoAsync(
            usuario.Email,
            "https://frontend.test");

        fixture.Context.ChangeTracker.Clear();

        var usuarioSalvo = await fixture.Context.TBL_USUARIO.SingleAsync(u => u.Id == usuario.Id);

        Assert.NotNull(usuarioSalvo.ResetSenhaTokenHash);
        Assert.NotNull(usuarioSalvo.ResetSenhaTokenExpiraEm);
        Assert.NotNull(usuarioSalvo.ResetSenhaSolicitadoEm);
        Assert.Single(fixture.EmailSender.MensagensEnviadas);
        Assert.Contains("/recuperarSenha?token=", fixture.EmailSender.MensagensEnviadas[0].CorpoTexto);
    }

    [Fact]
    public async Task SolicitarRedefinicaoAsync_NaoDeveFalharQuandoEmailNaoExiste()
    {
        using var fixture = new ServiceTestFixture();

        await fixture.PasswordResetService.SolicitarRedefinicaoAsync(
            "naoexiste@outlook.com",
            "https://frontend.test");

        Assert.Empty(fixture.EmailSender.MensagensEnviadas);
    }

    [Fact]
    public async Task ValidarTokenAsync_DeveFalharQuandoTokenForInvalido()
    {
        using var fixture = new ServiceTestFixture();

        var excecao = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.PasswordResetService.ValidarTokenAsync("token-invalido"));

        Assert.Equal("Link de redefinicao invalido ou expirado.", excecao.Message);
    }

    [Fact]
    public async Task RedefinirSenhaAsync_DeveAtualizarSenhaELimparToken()
    {
        using var fixture = new ServiceTestFixture();
        var usuario = await fixture.CriarUsuarioAsync("marina");

        await fixture.PasswordResetService.SolicitarRedefinicaoAsync(
            usuario.Email,
            "https://frontend.test");

        var token = fixture.ObterUltimoTokenRecuperacaoSenha();

        await fixture.PasswordResetService.RedefinirSenhaAsync(new RedefinirSenhaDto
        {
            Token = token,
            Password = "NovaSenha@123",
            ConfirmPassword = "NovaSenha@123"
        });

        fixture.Context.ChangeTracker.Clear();

        var usuarioAtualizado = await fixture.Context.TBL_USUARIO.SingleAsync(u => u.Id == usuario.Id);
        Assert.Null(usuarioAtualizado.ResetSenhaTokenHash);
        Assert.Null(usuarioAtualizado.ResetSenhaTokenExpiraEm);
        Assert.Null(usuarioAtualizado.ResetSenhaSolicitadoEm);
        Assert.Equal(1, usuarioAtualizado.SessaoVersao);

        var loginAntigo = await fixture.AuthService.Login(new LoginDto
        {
            Email = usuario.Email,
            Password = ServiceTestFixture.SenhaPadrao
        });
        Assert.Null(loginAntigo);

        var loginNovo = await fixture.AuthService.Login(new LoginDto
        {
            Email = usuario.Email,
            Password = "NovaSenha@123"
        });

        Assert.NotNull(loginNovo);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(loginNovo!.Token);
        Assert.Contains(jwt.Claims, claim =>
            claim.Type == TokenService.SessionVersionClaim &&
            claim.Value == "1");
    }
}
