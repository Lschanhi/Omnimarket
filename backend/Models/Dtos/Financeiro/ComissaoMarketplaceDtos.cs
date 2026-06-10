using System.ComponentModel.DataAnnotations;

namespace Omnimarket.Api.Models.Dtos.Financeiro
{
    public class CalculoComissaoMarketplaceDto
    {
        public decimal TaxaFixaComissao { get; set; }
        public decimal PercentualComissao { get; set; }
        public decimal ValorComissao { get; set; }
        public decimal ValorLiquidoVendedor { get; set; }
    }

    public class ConfiguracaoMarketplaceLeituraDto
    {
        public int? Id { get; set; }
        public decimal TaxaFixaComissao { get; set; }
        public decimal PercentualComissao { get; set; }
        public bool Ativo { get; set; }
        public DateTime? DataCriacao { get; set; }
        public bool UsaConfiguracaoPadrao { get; set; }
    }

    public class ConfiguracaoMarketplaceCriacaoDto
    {
        [Required]
        [Range(0, double.MaxValue)]
        public decimal TaxaFixaComissao { get; set; }

        [Required]
        [Range(0, 1)]
        public decimal PercentualComissao { get; set; }
    }

    public class ResumoFinanceiroVendedorDto
    {
        public decimal TotalVendidoBruto { get; set; }
        public decimal TotalComissaoMarketplace { get; set; }
        public decimal TotalLiquidoVendedor { get; set; }
        public int QuantidadePedidos { get; set; }
    }

    public class RateioComissaoVendedorDto
    {
        public int VendedorId { get; set; }
        public decimal ValorBruto { get; set; }
        public decimal ValorComissao { get; set; }
        public decimal ValorLiquidoVendedor { get; set; }
    }
}
