using System.ComponentModel.DataAnnotations;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Models.Entidades
{
    public class ProdutoMidia
    {
        public int Id { get; set; }

        [Required]
        public int ProdutoId { get; set; }

        public Produto Produto { get; set; } = null!;

        [Required]
        public TipoMidiaProduto Tipo { get; set; }

        [Required, StringLength(500)]
        public string Url { get; set; } = string.Empty;

        [StringLength(120)]
        public string? ContentType { get; set; }

        [StringLength(260)]
        public string NomeArquivo { get; set; } = string.Empty;

        public byte[]? Conteudo { get; set; }

        public int Ordem { get; set; } = 0;

        public DateTimeOffset DtCriacao { get; set; } = DateTimeOffset.UtcNow;
    }
}
