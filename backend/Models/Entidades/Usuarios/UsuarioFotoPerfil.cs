using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Omnimarket.Api.Models.Entidades
{
    [Index(nameof(UsuarioId), IsUnique = true)]
    public class UsuarioFotoPerfil
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [Required]
        [StringLength(120)]
        public string MimeType { get; set; } = string.Empty;

        [Required]
        [StringLength(260)]
        public string NomeArquivo { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Url { get; set; }

        [Required]
        public byte[] Conteudo { get; set; } = Array.Empty<byte>();

        public DateTimeOffset DtCriacao { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? DtAtualizacao { get; set; }
    }
}
