using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task RegistrarUsuario_DeveSalvarTelefoneEEnderecoAtivo()
    {
        using var fixture = new ServiceTestFixture();
        var dto = fixture.CriarRegistroUsuarioDto("ana");
        dto.Cpf = "529.982.247-25";

        var usuario = await fixture.AuthService.RegistrarUsuario(dto);

        fixture.Context.ChangeTracker.Clear();

        var usuarioSalvo = await fixture.Context.TBL_USUARIO
            .Include(u => u.Telefones)
            .Include(u => u.Enderecos)
            .SingleAsync(u => u.Id == usuario.Id);

        Assert.Equal("52998224725", usuarioSalvo.Cpf);
        Assert.Equal(dto.Email.ToLower().Trim(), usuarioSalvo.Email);
        Assert.Equal("User", usuarioSalvo.Role);
        Assert.True(usuarioSalvo.AceitouTermos);
        Assert.NotNull(usuarioSalvo.DataAceiteTermos);
        Assert.Single(usuarioSalvo.Telefones);
        Assert.True(usuarioSalvo.Telefones[0].IsPrincipal);
        Assert.Single(usuarioSalvo.Enderecos);
        Assert.True(usuarioSalvo.Enderecos[0].Ativo);
        Assert.True(usuarioSalvo.Enderecos[0].IsPrincipal);
    }

    [Fact]
    public async Task RegistrarUsuario_DevePermitirCadastroSemEndereco()
    {
        using var fixture = new ServiceTestFixture();
        var dto = fixture.CriarRegistroUsuarioDto("bruna");
        dto.Enderecos.Clear();

        var usuario = await fixture.AuthService.RegistrarUsuario(dto);

        fixture.Context.ChangeTracker.Clear();

        var usuarioSalvo = await fixture.Context.TBL_USUARIO
            .Include(u => u.Enderecos)
            .SingleAsync(u => u.Id == usuario.Id);

        Assert.Empty(usuarioSalvo.Enderecos);
    }

    [Fact]
    public async Task Login_DeveRetornarTokenComClaimsBasicasDoUsuario()
    {
        using var fixture = new ServiceTestFixture();
        var dto = fixture.CriarRegistroUsuarioDto("bruno");
        await fixture.AuthService.RegistrarUsuario(dto);

        var resposta = await fixture.AuthService.Login(new LoginDto
        {
            Email = dto.Email.ToUpperInvariant(),
            Password = ServiceTestFixture.SenhaPadrao
        });

        Assert.NotNull(resposta);
        Assert.False(string.IsNullOrWhiteSpace(resposta!.Token));
        Assert.Equal(dto.Email.ToLower().Trim(), resposta.Email);
        Assert.Equal("User", resposta.Role);
        Assert.Null(resposta.TokenExpiraEm);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(resposta.Token);

        Assert.Contains(jwt.Claims, claim =>
            claim.Type == ClaimTypes.Email &&
            claim.Value == dto.Email.ToLower().Trim());

        Assert.Contains(jwt.Claims, claim =>
            claim.Type == ClaimTypes.Role &&
            claim.Value == "User");

        Assert.Contains(jwt.Claims, claim =>
            claim.Type == TokenService.SessionVersionClaim &&
            claim.Value == "0");

        Assert.DoesNotContain(jwt.Claims, claim => claim.Type == "email_confirmed");
        Assert.DoesNotContain(jwt.Claims, claim => claim.Type == "exp");
    }

    [Fact]
    public async Task Login_DeveRetornarNuloQuandoSenhaForInvalida()
    {
        using var fixture = new ServiceTestFixture();
        var dto = fixture.CriarRegistroUsuarioDto("clara");
        await fixture.AuthService.RegistrarUsuario(dto);

        var resposta = await fixture.AuthService.Login(new LoginDto
        {
            Email = dto.Email,
            Password = "SenhaErrada@123"
        });

        Assert.Null(resposta);
    }

    [Fact]
    public async Task Login_DeveGerarTokenSemExpiracaoMesmoQuandoHouverConfiguracaoDeTempo()
    {
        using var fixture = new ServiceTestFixture(jwtExpireMinutes: "60");
        var dto = fixture.CriarRegistroUsuarioDto("daniel");
        await fixture.AuthService.RegistrarUsuario(dto);

        var resposta = await fixture.AuthService.Login(new LoginDto
        {
            Email = dto.Email,
            Password = ServiceTestFixture.SenhaPadrao
        });

        Assert.NotNull(resposta);
        Assert.Null(resposta!.TokenExpiraEm);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(resposta.Token);
        Assert.DoesNotContain(jwt.Claims, claim => claim.Type == "exp");
    }

    [Fact]
    public async Task Logout_DeveInvalidarSessaoAtualEGerarNovaVersaoNoProximoLogin()
    {
        using var fixture = new ServiceTestFixture();
        var dto = fixture.CriarRegistroUsuarioDto("eduardo");
        var usuario = await fixture.AuthService.RegistrarUsuario(dto);

        var primeiroLogin = await fixture.AuthService.Login(new LoginDto
        {
            Email = dto.Email,
            Password = ServiceTestFixture.SenhaPadrao
        });

        Assert.NotNull(primeiroLogin);

        var primeiroJwt = new JwtSecurityTokenHandler().ReadJwtToken(primeiroLogin!.Token);
        var sessaoVersaoInicial = primeiroJwt.Claims
            .Single(claim => claim.Type == TokenService.SessionVersionClaim)
            .Value;

        Assert.Equal("0", sessaoVersaoInicial);
        Assert.True(await fixture.AuthService.SessaoEstaAtivaAsync(usuario.Id, 0));

        await fixture.AuthService.LogoutAsync(usuario.Id);

        fixture.Context.ChangeTracker.Clear();

        var usuarioAtualizado = await fixture.Context.TBL_USUARIO.SingleAsync(u => u.Id == usuario.Id);
        Assert.Equal(1, usuarioAtualizado.SessaoVersao);
        Assert.False(await fixture.AuthService.SessaoEstaAtivaAsync(usuario.Id, 0));

        var segundoLogin = await fixture.AuthService.Login(new LoginDto
        {
            Email = dto.Email,
            Password = ServiceTestFixture.SenhaPadrao
        });

        Assert.NotNull(segundoLogin);

        var segundoJwt = new JwtSecurityTokenHandler().ReadJwtToken(segundoLogin!.Token);
        Assert.Contains(segundoJwt.Claims, claim =>
            claim.Type == TokenService.SessionVersionClaim &&
            claim.Value == "1");
        Assert.True(await fixture.AuthService.SessaoEstaAtivaAsync(usuario.Id, 1));
    }
}
