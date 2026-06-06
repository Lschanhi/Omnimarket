namespace Omnimarket.Api.Models.Configuracoes
{
    public class AzureBlobStorageOptions
    {
        public const string SectionName = "AzureBlobStorage";
        public const string AppServiceSectionName = "BlobStorage";

        public string ConnectionString { get; set; } = string.Empty;
        public string FotoPerfilContainerName { get; set; } = string.Empty;
        public string FotoProdutoContainerName { get; set; } = string.Empty;
        public string VideoProdutoContainerName { get; set; } = string.Empty;
        public string FotoPerfilLojaContainerName { get; set; } = string.Empty;
        public bool MigrateLegacyImagesOnStartup { get; set; } = true;
    }
}
