using Microsoft.EntityFrameworkCore;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models.Dtos.Financeiro;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Services
{
    public class VendedorFinanceiroService
    {
        private static readonly StatusVenda[] StatusesComReceita =
        [
            StatusVenda.Paga,
            StatusVenda.Pendente,
            StatusVenda.EmSeparacao,
            StatusVenda.Pronto,
            StatusVenda.Enviada,
            StatusVenda.Concluida
        ];

        private readonly DataContext _context;

        public VendedorFinanceiroService(DataContext context)
        {
            _context = context;
        }

        public async Task<ResumoFinanceiroVendedorDto> ObterResumoAsync(int vendedorId)
        {
            var resumo = await _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => v.VendedorId == vendedorId && StatusesComReceita.Contains(v.StatusVenda))
                .GroupBy(_ => 1)
                .Select(g => new ResumoFinanceiroVendedorDto
                {
                    TotalVendidoBruto = g.Sum(v => v.ValorBruto),
                    TotalComissaoMarketplace = g.Sum(v => v.ValorBruto - v.ValorLiquido),
                    TotalLiquidoVendedor = g.Sum(v => v.ValorLiquido),
                    QuantidadePedidos = g.Count()
                })
                .FirstOrDefaultAsync();

            if (resumo == null)
            {
                return new ResumoFinanceiroVendedorDto
                {
                    TotalVendidoBruto = 0m,
                    TotalComissaoMarketplace = 0m,
                    TotalLiquidoVendedor = 0m,
                    QuantidadePedidos = 0
                };
            }

            resumo.TotalVendidoBruto = ComissaoMarketplaceService.ArredondarMoeda(resumo.TotalVendidoBruto);
            resumo.TotalComissaoMarketplace = ComissaoMarketplaceService.ArredondarMoeda(resumo.TotalComissaoMarketplace);
            resumo.TotalLiquidoVendedor = ComissaoMarketplaceService.ArredondarMoeda(resumo.TotalLiquidoVendedor);

            return resumo;
        }
    }
}
