namespace Omnimarket.Api.Tests;

public class ConnectionStringResolverTests
{
    [Fact]
    public void Resolve_EmDevelopment_PrefereConexaoLocal()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:ConexaoLocal"] = "Server=localhost;Database=Omnimarket;User Id=sa;Password=senha;",
            ["ConnectionStrings:ConexaoAzureBk"] = "Server=tcp:azure.database.windows.net,1433;Database=Omnimarket;"
        });

        var (name, value) = ConnectionStringResolver.Resolve(configuration, isDevelopment: true);

        Assert.Equal("ConexaoLocal", name);
        Assert.Contains("localhost", value, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Resolve_ForaDeDevelopment_PrefereConexaoAzureBk()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:ConexaoLocal"] = "Server=localhost;Database=Omnimarket;User Id=sa;Password=senha;",
            ["ConnectionStrings:ConexaoAzureBk"] = "Server=tcp:azure.database.windows.net,1433;Database=Omnimarket;"
        });

        var (name, value) = ConnectionStringResolver.Resolve(configuration, isDevelopment: false);

        Assert.Equal("ConexaoAzureBk", name);
        Assert.Contains("azure.database.windows.net", value, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Resolve_UsaConnectionStringNameQuandoConfigurado()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["Database:ConnectionStringName"] = "ConexaoCasa",
            ["ConnectionStrings:ConexaoCasa"] = "Server=localhost;Database=OmnimarketCasa;User Id=sa;Password=senha;"
        });

        var (name, value) = ConnectionStringResolver.Resolve(configuration, isDevelopment: false);

        Assert.Equal("ConexaoCasa", name);
        Assert.Contains("OmnimarketCasa", value, StringComparison.Ordinal);
    }

    [Fact]
    public void Resolve_IgnoraConnectionStringComPlaceholder()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:ConexaoLocal"] = "Server=localhost;Database=Omnimarket;User Id=sa;Password=senha;",
            ["ConnectionStrings:ConexaoAzureBk"] = "Server=SEU_SERVIDOR;Database=SEU_BANCO;User Id=SEU_USUARIO;Password=SUA_SENHA;"
        });

        var (name, value) = ConnectionStringResolver.Resolve(configuration, isDevelopment: false);

        Assert.Equal("ConexaoLocal", name);
        Assert.Contains("localhost", value, StringComparison.OrdinalIgnoreCase);
    }

    private static IConfiguration CriarConfiguration(Dictionary<string, string?> valores)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(valores)
            .Build();
    }
}
