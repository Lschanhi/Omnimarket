using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Omnimarket.Api.Models.Entidades
{
    public class ConfiguracaoMarketplace
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal TaxaFixaComissao { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,4)")]
        [Range(0, 1)]
        public decimal PercentualComissao { get; set; }

        [Required]
        public bool Ativo { get; set; } = true;

        [Required]
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}
