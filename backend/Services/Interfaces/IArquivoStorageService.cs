namespace Omnimarket.Api.Services.Interfaces
{
    public interface IArquivoStorageService
    {
        Task<string> SalvarAsync(
            string containerName,
            string diretorio,
            string nomeArquivo,
            string contentType,
            Stream conteudo,
            CancellationToken cancellationToken = default);

        Task RemoverAsync(string? urlArquivo, CancellationToken cancellationToken = default);

        bool UrlPertenceAoContainer(string? urlArquivo, string containerName);
    }
}
