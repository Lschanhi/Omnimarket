using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Omnimarket.Api.Models.Entidades
{
    public class HistoricoProduto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProdutoId { get; set; }

        [ForeignKey(nameof(ProdutoId))]
        public Produto Produto { get; set; } = null!;

        [Required]
        public int LojaId { get; set; }

        [Required]
        public int UsuarioResponsavelId { get; set; }

        [Required]
        [StringLength(40)]
        public string TipoAlteracao { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string NomeProdutoSnapshot { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string CategoriaProdutoSnapshot { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue)]
        public decimal? PrecoAnterior { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? PrecoNovo { get; set; }

        [Range(0, int.MaxValue)]
        public int? EstoqueAnterior { get; set; }

        [Range(0, int.MaxValue)]
        public int? EstoqueNovo { get; set; }

        [StringLength(1000)]
        public string? DescricaoAnterior { get; set; }

        [StringLength(1000)]
        public string? DescricaoNova { get; set; }

        public DateTimeOffset DataAlteracao { get; set; } = DateTimeOffset.UtcNow;
    }
}
