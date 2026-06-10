using Microsoft.EntityFrameworkCore;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models.Dtos.Financeiro;
using Omnimarket.Api.Models.Entidades;

namespace Omnimarket.Api.Services
{
    public class ComissaoMarketplaceService
    {
        private const decimal TaxaFixaPadrao = 1.50m;
        private const decimal PercentualPadrao = 0.05m;

        private readonly DataContext _context;

        public ComissaoMarketplaceService(DataContext context)
        {
            _context = context;
        }

        public async Task<CalculoComissaoMarketplaceDto> CalcularComissaoAsync(decimal valorProdutos)
        {
            var configuracao = await _context.TBL_CONFIGURACAO_MARKETPLACE
                .AsNoTracking()
                .Where(c => c.Ativo)
                .OrderByDescending(c => c.DataCriacao)
                .ThenByDescending(c => c.Id)
                .FirstOrDefaultAsync();

            return CalcularComissao(
                valorProdutos,
                configuracao?.TaxaFixaComissao ?? TaxaFixaPadrao,
                configuracao?.PercentualComissao ?? PercentualPadrao);
        }

        public async Task<ConfiguracaoMarketplaceLeituraDto> ObterConfiguracaoAtivaAsync()
        {
            var configuracao = await _context.TBL_CONFIGURACAO_MARKETPLACE
                .AsNoTracking()
                .Where(c => c.Ativo)
                .OrderByDescending(c => c.DataCriacao)
                .ThenByDescending(c => c.Id)
                .FirstOrDefaultAsync();

            if (configuracao == null)
            {
                return new ConfiguracaoMarketplaceLeituraDto
                {
                    TaxaFixaComissao = TaxaFixaPadrao,
                    PercentualComissao = PercentualPadrao,
                    Ativo = true,
                    UsaConfiguracaoPadrao = true
                };
            }

            return MapearConfiguracao(configuracao);
        }

        public async Task<ConfiguracaoMarketplaceLeituraDto> CriarConfiguracaoAsync(
            ConfiguracaoMarketplaceCriacaoDto dto)
        {
            var configuracoesAtivas = await _context.TBL_CONFIGURACAO_MARKETPLACE
                .Where(c => c.Ativo)
                .ToListAsync();

            foreach (var configuracaoAtiva in configuracoesAtivas)
                configuracaoAtiva.Ativo = false;

            var configuracao = new ConfiguracaoMarketplace
            {
                TaxaFixaComissao = ArredondarMoeda(dto.TaxaFixaComissao),
                PercentualComissao = Math.Round(dto.PercentualComissao, 4, MidpointRounding.AwayFromZero),
                Ativo = true,
                DataCriacao = DateTime.UtcNow
            };

            await _context.TBL_CONFIGURACAO_MARKETPLACE.AddAsync(configuracao);
            await _context.SaveChangesAsync();

            return MapearConfiguracao(configuracao);
        }

        public async Task AplicarSnapshotAoPedidoAsync(Pedido pedido, bool sobrescrever = false)
        {
            if (!sobrescrever && PedidoJaPossuiSnapshotDeComissao(pedido))
                return;

            var calculo = await CalcularComissaoAsync(pedido.ValorTotalProdutos);

            pedido.TaxaFixaComissao = calculo.TaxaFixaComissao;
            pedido.PercentualComissao = calculo.PercentualComissao;
            pedido.ValorComissao = calculo.ValorComissao;
            pedido.ValorLiquidoVendedor = calculo.ValorLiquidoVendedor;
        }

        public static IReadOnlyList<RateioComissaoVendedorDto> RatearComissaoEntreVendedores(
            IEnumerable<(int VendedorId, decimal ValorBruto)> vendas,
            decimal valorComissaoTotal)
        {
            var vendasNormalizadas = vendas
                .Select(v => new
                {
                    v.VendedorId,
                    ValorBruto = ArredondarMoeda(v.ValorBruto)
                })
                .Where(v => v.ValorBruto > 0)
                .OrderBy(v => v.VendedorId)
                .ToList();

            if (vendasNormalizadas.Count == 0)
                return [];

            if (vendasNormalizadas.Count == 1)
            {
                var unicaVenda = vendasNormalizadas[0];
                var valorComissao = ArredondarMoeda(valorComissaoTotal);

                return
                [
                    new RateioComissaoVendedorDto
                    {
                        VendedorId = unicaVenda.VendedorId,
                        ValorBruto = unicaVenda.ValorBruto,
                        ValorComissao = valorComissao,
                        ValorLiquidoVendedor = ArredondarMoeda(unicaVenda.ValorBruto - valorComissao)
                    }
                ];
            }

            var totalBruto = vendasNormalizadas.Sum(v => v.ValorBruto);
            if (totalBruto <= 0)
                return [];

            var valorComissaoArredondado = ArredondarMoeda(valorComissaoTotal);
            var rateioBase = vendasNormalizadas
                .Select(v =>
                {
                    var valorCru = valorComissaoArredondado * v.ValorBruto / totalBruto;
                    var valorBase = Math.Floor(valorCru * 100m) / 100m;

                    return new
                    {
                        v.VendedorId,
                        v.ValorBruto,
                        ValorComissaoCru = valorCru,
                        ValorComissaoBase = valorBase,
                        Fracao = valorCru - valorBase
                    };
                })
                .ToList();

            var totalBase = rateioBase.Sum(v => v.ValorComissaoBase);
            var centavosRestantes = (int)Math.Round(
                (valorComissaoArredondado - totalBase) * 100m,
                0,
                MidpointRounding.AwayFromZero);

            var vendedoresComCentavoExtra = rateioBase
                .OrderByDescending(v => v.Fracao)
                .ThenByDescending(v => v.ValorBruto)
                .ThenBy(v => v.VendedorId)
                .Take(Math.Max(0, centavosRestantes))
                .Select(v => v.VendedorId)
                .ToHashSet();

            return rateioBase
                .Select(v =>
                {
                    var valorComissao = v.ValorComissaoBase +
                        (vendedoresComCentavoExtra.Contains(v.VendedorId) ? 0.01m : 0m);

                    return new RateioComissaoVendedorDto
                    {
                        VendedorId = v.VendedorId,
                        ValorBruto = v.ValorBruto,
                        ValorComissao = ArredondarMoeda(valorComissao),
                        ValorLiquidoVendedor = ArredondarMoeda(v.ValorBruto - valorComissao)
                    };
                })
                .OrderBy(v => v.VendedorId)
                .ToList();
        }

        public static CalculoComissaoMarketplaceDto CalcularComissao(
            decimal valorProdutos,
            decimal taxaFixaComissao,
            decimal percentualComissao)
        {
            var valorProdutosArredondado = ArredondarMoeda(valorProdutos);
            var taxaFixaArredondada = ArredondarMoeda(taxaFixaComissao);
            var percentualArredondado = Math.Round(percentualComissao, 4, MidpointRounding.AwayFromZero);
            var valorComissao = ArredondarMoeda(
                taxaFixaArredondada + (percentualArredondado * valorProdutosArredondado));

            return new CalculoComissaoMarketplaceDto
            {
                TaxaFixaComissao = taxaFixaArredondada,
                PercentualComissao = percentualArredondado,
                ValorComissao = valorComissao,
                ValorLiquidoVendedor = ArredondarMoeda(valorProdutosArredondado - valorComissao)
            };
        }

        public static bool PedidoJaPossuiSnapshotDeComissao(Pedido pedido)
        {
            return pedido.TaxaFixaComissao > 0 ||
                pedido.PercentualComissao > 0 ||
                pedido.ValorComissao > 0 ||
                pedido.ValorLiquidoVendedor > 0;
        }

        public static decimal ArredondarMoeda(decimal valor)
            => Math.Round(valor, 2, MidpointRounding.AwayFromZero);

        private static ConfiguracaoMarketplaceLeituraDto MapearConfiguracao(
            ConfiguracaoMarketplace configuracao)
        {
            return new ConfiguracaoMarketplaceLeituraDto
            {
                Id = configuracao.Id,
                TaxaFixaComissao = configuracao.TaxaFixaComissao,
                PercentualComissao = configuracao.PercentualComissao,
                Ativo = configuracao.Ativo,
                DataCriacao = configuracao.DataCriacao,
                UsaConfiguracaoPadrao = false
            };
        }
    }
}
