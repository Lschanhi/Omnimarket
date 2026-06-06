using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Omnimarket.Api.Tests;

public class AzureBlobStorageOptionsBindingTests
{
    [Fact]
    public void DevePermitirConfigurarBlobStoragePorSecaoAlternativaDoAppService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["BlobStorage:ConnectionString"] = "UseDevelopmentStorage=true",
                ["BlobStorage:FotoPerfilContainerName"] = "foto-perfil",
                ["BlobStorage:FotoProdutoContainerName"] = "foto-produto",
                ["BlobStorage:VideoProdutoContainerName"] = "videos-produto",
                ["BlobStorage:FotoPerfilLojaContainerName"] = "foto-perfil-loja"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddOptions<AzureBlobStorageOptions>()
            .Configure<IConfiguration>((options, config) =>
            {
                config.GetSection(AzureBlobStorageOptions.SectionName).Bind(options);
                config.GetSection(AzureBlobStorageOptions.AppServiceSectionName).Bind(options);
            });

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<AzureBlobStorageOptions>>().Value;

        Assert.Equal("UseDevelopmentStorage=true", options.ConnectionString);
        Assert.Equal("foto-perfil", options.FotoPerfilContainerName);
        Assert.Equal("foto-produto", options.FotoProdutoContainerName);
        Assert.Equal("videos-produto", options.VideoProdutoContainerName);
        Assert.Equal("foto-perfil-loja", options.FotoPerfilLojaContainerName);
    }
}
