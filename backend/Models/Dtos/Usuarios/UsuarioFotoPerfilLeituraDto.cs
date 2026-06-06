namespace Omnimarket.Api.Models.Dtos.Usuarios
{
    public class UsuarioFotoPerfilLeituraDto
    {
        public string AvatarUrl { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public string NomeArquivo { get; set; } = string.Empty;
        public DateTimeOffset? DtAtualizacao { get; set; }
    }
}
