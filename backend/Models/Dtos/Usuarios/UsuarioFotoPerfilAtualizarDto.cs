using System.ComponentModel.DataAnnotations;

namespace Omnimarket.Api.Models.Dtos.Usuarios
{
    public class UsuarioFotoPerfilAtualizarDto
    {
        [StringLength(500)]
        public string? ArquivoUrl { get; set; }

        [StringLength(120)]
        public string? MimeType { get; set; }

        public string? DataUrl { get; set; }

        [StringLength(260)]
        public string? NomeArquivo { get; set; }
    }
}
