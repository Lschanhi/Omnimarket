namespace Omnimarket.Api.Models.Dtos.Uploads
{
    public class ArquivoUploadLeituraDto
    {
        public string Url { get; set; } = string.Empty;
        public string NomeArquivo { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public long TamanhoBytes { get; set; }
    }
}
