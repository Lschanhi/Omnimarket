using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Tests.Support;

namespace Omnimarket.Api.Tests;

public class AdminUsuarioServiceTests
{
    [Fact]
    public async Task ExcluirUsuarioPorEmailAsync_DeveExcluirUsuarioSemHistorico()
    {
        using var fixture = new ServiceTestFixture();
        var admin = await fixture.CriarUsuarioAsync("admin", RolesSistema.Admin);
        var usuario = await fixture.CriarUsuarioAsync("cliente");
        await fixture.CriarTelefoneAsync(usuario.Id);
        await fixture.CriarEnderecoAsync(usuario.Id);

        var service = new AdminUsuarioService(fixture.Context);

        var removido = await service.ExcluirUsuarioPorEmailAsync(usuario.Email, admin.Id);

        Assert.NotNull(removido);
        Assert.Equal(usuario.Id, removido!.Id);
        Assert.Equal(usuario.Email, removido.Email);
        Assert.False(await fixture.Context.TBL_USUARIO.AnyAsync(u => u.Id == usuario.Id));
    }

    [Fact]
    public async Task ExcluirUsuarioPorIdAsync_DeveImpedirAutoExclusao()
    {
        using var fixture = new ServiceTestFixture();
        var admin = await fixture.CriarUsuarioAsync("admin", RolesSistema.Admin);
        var service = new AdminUsuarioService(fixture.Context);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExcluirUsuarioPorIdAsync(admin.Id, admin.Id));

        Assert.Equal("Voce nao pode excluir seu proprio usuario.", ex.Message);
    }

    [Fact]
    public async Task ExcluirUsuarioPorIdAsync_DeveImpedirExclusaoDoUltimoAdmin()
    {
        using var fixture = new ServiceTestFixture();
        var admin = await fixture.CriarUsuarioAsync("admin", RolesSistema.Admin);
        var service = new AdminUsuarioService(fixture.Context);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExcluirUsuarioPorIdAsync(admin.Id, adminLogadoId: admin.Id + 999));

        Assert.Equal("Mantenha pelo menos um administrador ativo.", ex.Message);
    }

    [Fact]
    public async Task ExcluirUsuarioPorIdAsync_DeveImpedirUsuarioComLoja()
    {
        using var fixture = new ServiceTestFixture();
        var admin = await fixture.CriarUsuarioAsync("admin", RolesSistema.Admin);
        var vendedor = await fixture.CriarUsuarioAsync("vendedor", RolesSistema.Vendedor);
        await fixture.CriarLojaAsync(vendedor.Id, criarOpcaoRetiradaPadrao: false);

        var service = new AdminUsuarioService(fixture.Context);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExcluirUsuarioPorIdAsync(vendedor.Id, admin.Id));

        Assert.Equal("Nao e possivel excluir usuarios com loja cadastrada.", ex.Message);
    }

    [Fact]
    public async Task ExcluirUsuarioPorIdAsync_DeveImpedirUsuarioComPedidos()
    {
        using var fixture = new ServiceTestFixture();
        var admin = await fixture.CriarUsuarioAsync("admin", RolesSistema.Admin);
        var pedido = await fixture.CriarPedidoPendenteAsync();
        var service = new AdminUsuarioService(fixture.Context);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExcluirUsuarioPorIdAsync(pedido.CompradorId, admin.Id));

        Assert.Equal("Nao e possivel excluir usuarios com pedidos cadastrados.", ex.Message);
    }
}
