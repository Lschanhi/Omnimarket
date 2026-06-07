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
    public void Resolve_ForaDeDevelopment_PrefereConexaoAzure()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:ConexaoAzure"] = "Server=tcp:azure-principal.database.windows.net,1433;Database=Omnimarket;",
            ["ConnectionStrings:ConexaoAzureBk"] = "Server=tcp:azure.database.windows.net,1433;Database=Omnimarket;"
        });

        var (name, value) = ConnectionStringResolver.Resolve(configuration, isDevelopment: false);

        Assert.Equal("ConexaoAzure", name);
        Assert.Contains("azure-principal.database.windows.net", value, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Resolve_ForaDeDevelopment_UsaConexaoAzureBkComoReserva()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["Database:ConnectionStringName"] = "ConexaoAzure",
            ["ConnectionStrings:ConexaoAzure"] = "Server=tcp:SEU_SERVIDOR.database.windows.net,1433;Database=SEU_BANCO;User Id=SEU_USUARIO;Password=SUA_SENHA;",
            ["ConnectionStrings:ConexaoAzureBk"] = "Server=tcp:azure-backup.database.windows.net,1433;Database=OmnimarketBackup;"
        });

        var (name, value) = ConnectionStringResolver.Resolve(configuration, isDevelopment: false);

        Assert.Equal("ConexaoAzureBk", name);
        Assert.Contains("azure-backup.database.windows.net", value, StringComparison.OrdinalIgnoreCase);
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
    public void Resolve_ForaDeDevelopment_NaoUsaConexaoLocalComoFallback()
    {
        var configuration = CriarConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:ConexaoAzure"] = "Server=tcp:SEU_SERVIDOR.database.windows.net,1433;Database=SEU_BANCO;User Id=SEU_USUARIO;Password=SUA_SENHA;",
            ["ConnectionStrings:ConexaoLocal"] = "Server=localhost;Database=Omnimarket;User Id=sa;Password=senha;"
        });

        Assert.Throws<InvalidOperationException>(() => ConnectionStringResolver.Resolve(configuration, isDevelopment: false));
    }

    private static IConfiguration CriarConfiguration(Dictionary<string, string?> valores)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(valores)
            .Build();
    }
}
