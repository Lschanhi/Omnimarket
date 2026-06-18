using Microsoft.EntityFrameworkCore;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models.Dtos.Admin;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class AdminDashboardService
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

        public AdminDashboardService(DataContext context)
        {
            _context = context;
        }

        public async Task<AdminDashboardDto> ObterDashboardAsync()
        {
            var inicioSerieUtc = DateTime.UtcNow.Date.AddDays(-6);

            var totalUsuarios = await _context.TBL_USUARIO.AsNoTracking().CountAsync();
            var totalAdmins = await _context.TBL_USUARIO
                .AsNoTracking()
                .CountAsync(u => u.Role == RolesSistema.Admin);
            var totalLojas = await _context.TBL_LOJA.AsNoTracking().CountAsync();
            var totalLojasAtivas = await _context.TBL_LOJA.AsNoTracking().CountAsync(l => l.Ativa);
            var totalProdutos = await _context.TBL_PRODUTO.AsNoTracking().CountAsync();
            var produtosPublicados = await _context.TBL_PRODUTO
                .AsNoTracking()
                .CountAsync(p => p.StatusPublicacao == StatusProduto.Publicado);
            var totalPedidos = await _context.TBL_PEDIDO.AsNoTracking().CountAsync();
            var pedidosPendentes = await _context.TBL_PEDIDO
                .AsNoTracking()
                .CountAsync(p => p.StatusPedidosId == StatusPedido.Pendente);
            var pedidosPagos = await _context.TBL_PEDIDO
                .AsNoTracking()
                .CountAsync(p =>
                    p.StatusPedidosId == StatusPedido.Pago ||
                    p.StatusPedidosId == StatusPedido.Enviado ||
                    p.StatusPedidosId == StatusPedido.Entregue);
            var receitaTotalMarketplace = await _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => StatusesComReceita.Contains(v.StatusVenda))
                .SumAsync(v => (decimal?)v.ValorBruto);
            var comissaoTotalMarketplace = await _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => StatusesComReceita.Contains(v.StatusVenda))
                .SumAsync(v => (decimal?)(v.ValorBruto - v.ValorLiquido));
            var ticketMedioPedidos = await _context.TBL_PEDIDO
                .AsNoTracking()
                .Where(p => p.StatusPedidosId != StatusPedido.Cancelado)
                .AverageAsync(p => (decimal?)p.ValorTotalPedido);
            var totalVisualizacoesLojas = await _context.TBL_LOJA
                .AsNoTracking()
                .SumAsync(l => (int?)l.TotalVisualizacoes);
            var totalVisualizacoesProdutos = await _context.TBL_PRODUTO
                .AsNoTracking()
                .SumAsync(p => (int?)p.TotalVisualizacoes);

            var pedidosPorStatus = await _context.TBL_PEDIDO
                .AsNoTracking()
                .GroupBy(p => p.StatusPedidosId)
                .Select(g => new
                {
                    Status = g.Key,
                    Total = g.Count(),
                    ValorTotal = g.Sum(p => p.ValorTotalPedido)
                })
                .ToListAsync();

            var vendasPorStatus = await _context.TBL_VENDA
                .AsNoTracking()
                .GroupBy(v => v.StatusVenda)
                .Select(g => new
                {
                    Status = g.Key,
                    Total = g.Count(),
                    ValorTotal = g.Sum(v => v.ValorBruto)
                })
                .ToListAsync();

            var pedidosPorDia = await _context.TBL_PEDIDO
                .AsNoTracking()
                .Where(p => p.DataPedido >= inicioSerieUtc)
                .Select(p => new
                {
                    p.DataPedido,
                    p.ValorTotalPedido
                })
                .ToListAsync();

            var vendasPorDia = await _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => v.DataCriacao >= inicioSerieUtc && StatusesComReceita.Contains(v.StatusVenda))
                .Select(v => new
                {
                    v.DataCriacao,
                    v.ValorBruto
                })
                .ToListAsync();

            var produtosMaisVendidos = await _context.TBL_ITENS_PEDIDO
                .AsNoTracking()
                .Where(i => i.Pedido.StatusPedidosId != StatusPedido.Cancelado)
                .GroupBy(i => new
                {
                    i.ProdutoId,
                    i.NomeProdutoSnapshot,
                    i.NomeLojaSnapshot
                })
                .Select(g => new AdminRankingProdutoDto
                {
                    ProdutoId = g.Key.ProdutoId,
                    Nome = g.Key.NomeProdutoSnapshot,
                    NomeLoja = g.Key.NomeLojaSnapshot,
                    TotalQuantidade = g.Sum(i => i.Quantidade),
                    ValorTotal = g.Sum(i => i.ValorTotal),
                    TotalVisualizacoes = _context.TBL_PRODUTO
                        .Where(p => p.Id == g.Key.ProdutoId)
                        .Select(p => (int?)p.TotalVisualizacoes)
                        .FirstOrDefault() ?? 0
                })
                .OrderByDescending(p => p.TotalQuantidade)
                .ThenByDescending(p => p.ValorTotal)
                .Take(5)
                .ToListAsync();

            var produtosMaisVisualizados = await _context.TBL_PRODUTO
                .AsNoTracking()
                .OrderByDescending(p => p.TotalVisualizacoes)
                .ThenByDescending(p => p.TotalAvaliacoes)
                .ThenByDescending(p => p.MediaAvaliacao)
                .Take(5)
                .Select(p => new AdminRankingProdutoDto
                {
                    ProdutoId = p.Id,
                    Nome = p.Nome,
                    NomeLoja = p.Loja.NomeFantasia,
                    TotalQuantidade = _context.TBL_ITENS_PEDIDO
                        .Where(i => i.ProdutoId == p.Id && i.Pedido.StatusPedidosId != StatusPedido.Cancelado)
                        .Sum(i => (int?)i.Quantidade) ?? 0,
                    ValorTotal = _context.TBL_ITENS_PEDIDO
                        .Where(i => i.ProdutoId == p.Id && i.Pedido.StatusPedidosId != StatusPedido.Cancelado)
                        .Sum(i => (decimal?)i.ValorTotal) ?? 0m,
                    TotalVisualizacoes = p.TotalVisualizacoes
                })
                .ToListAsync();

            var lojasMaisVisitadas = await _context.TBL_LOJA
                .AsNoTracking()
                .OrderByDescending(l => l.TotalVisualizacoes)
                .ThenByDescending(l => l.TotalAvaliacoes)
                .ThenByDescending(l => l.MediaAvaliacao)
                .Take(5)
                .Select(l => new AdminRankingLojaDto
                {
                    LojaId = l.Id,
                    NomeFantasia = l.NomeFantasia,
                    Ativa = l.Ativa,
                    TotalVisualizacoes = l.TotalVisualizacoes,
                    TotalProdutosPublicados = l.Produtos.Count(p => p.StatusPublicacao == StatusProduto.Publicado),
                    ValorBruto = _context.TBL_VENDA
                        .Where(v => v.VendedorId == l.UsuarioId && StatusesComReceita.Contains(v.StatusVenda))
                        .Sum(v => (decimal?)v.ValorBruto) ?? 0m
                })
                .ToListAsync();

            var lojasComMaiorReceita = await _context.TBL_LOJA
                .AsNoTracking()
                .Select(l => new AdminRankingLojaDto
                {
                    LojaId = l.Id,
                    NomeFantasia = l.NomeFantasia,
                    Ativa = l.Ativa,
                    TotalVisualizacoes = l.TotalVisualizacoes,
                    TotalProdutosPublicados = l.Produtos.Count(p => p.StatusPublicacao == StatusProduto.Publicado),
                    ValorBruto = _context.TBL_VENDA
                        .Where(v => v.VendedorId == l.UsuarioId && StatusesComReceita.Contains(v.StatusVenda))
                        .Sum(v => (decimal?)v.ValorBruto) ?? 0m
                })
                .OrderByDescending(l => l.ValorBruto)
                .ThenByDescending(l => l.TotalVisualizacoes)
                .Take(5)
                .ToListAsync();

            var totalVisualizacoesLojasNormalizado = totalVisualizacoesLojas ?? 0;
            var totalVisualizacoesProdutosNormalizado = totalVisualizacoesProdutos ?? 0;

            return new AdminDashboardDto
            {
                TotalUsuarios = totalUsuarios,
                TotalAdmins = totalAdmins,
                TotalLojas = totalLojas,
                TotalLojasAtivas = totalLojasAtivas,
                TotalProdutos = totalProdutos,
                ProdutosPublicados = produtosPublicados,
                TotalPedidos = totalPedidos,
                PedidosPendentes = pedidosPendentes,
                PedidosPagos = pedidosPagos,
                ReceitaTotalMarketplace = receitaTotalMarketplace ?? 0m,
                ComissaoTotalMarketplace = comissaoTotalMarketplace ?? 0m,
                TicketMedioPedidos = ticketMedioPedidos ?? 0m,
                TotalVisualizacoesLojas = totalVisualizacoesLojasNormalizado,
                TotalVisualizacoesProdutos = totalVisualizacoesProdutosNormalizado,
                TotalAcessosCatalogo = totalVisualizacoesLojasNormalizado + totalVisualizacoesProdutosNormalizado,
                PedidosPorStatus = pedidosPorStatus
                    .Select(item => new AdminStatusResumoDto
                    {
                        Chave = item.Status.ToString(),
                        Label = FormatarStatusPedido(item.Status),
                        Total = item.Total,
                        ValorTotal = item.ValorTotal
                    })
                    .OrderByDescending(item => item.Total)
                    .ToList(),
                VendasPorStatus = vendasPorStatus
                    .Select(item => new AdminStatusResumoDto
                    {
                        Chave = item.Status.ToString(),
                        Label = FormatarStatusVenda(item.Status),
                        Total = item.Total,
                        ValorTotal = item.ValorTotal
                    })
                    .OrderByDescending(item => item.Total)
                    .ToList(),
                ReceitaPorDia = CriarSerieDiaria(
                    inicioSerieUtc,
                    pedidosPorDia.Select(p => p.DataPedido),
                    vendasPorDia.Select(v => (v.DataCriacao, v.ValorBruto))),
                PedidosPorDia = CriarSerieDiaria(
                    inicioSerieUtc,
                    pedidosPorDia.Select(p => p.DataPedido),
                    Enumerable.Empty<(DateTime Data, decimal Valor)>()),
                ProdutosMaisVendidos = produtosMaisVendidos,
                ProdutosMaisVisualizados = produtosMaisVisualizados,
                LojasMaisVisitadas = lojasMaisVisitadas,
                LojasComMaiorReceita = lojasComMaiorReceita
            };
        }

        private static List<AdminSerieDiariaDto> CriarSerieDiaria(
            DateTime inicioSerieUtc,
            IEnumerable<DateTime> pedidos,
            IEnumerable<(DateTime Data, decimal Valor)> valores)
        {
            var pedidosPorDia = pedidos
                .GroupBy(data => data.Date)
                .ToDictionary(group => group.Key, group => group.Count());

            var valoresPorDia = valores
                .GroupBy(item => item.Data.Date)
                .ToDictionary(group => group.Key, group => group.Sum(item => item.Valor));

            var serie = new List<AdminSerieDiariaDto>();

            for (var indice = 0; indice < 7; indice++)
            {
                var data = inicioSerieUtc.AddDays(indice);
                pedidosPorDia.TryGetValue(data, out var totalPedidos);
                valoresPorDia.TryGetValue(data, out var valorTotal);

                serie.Add(new AdminSerieDiariaDto
                {
                    Data = data.ToString("yyyy-MM-dd"),
                    Label = data.ToString("dd/MM"),
                    Total = totalPedidos,
                    Valor = valorTotal
                });
            }

            return serie;
        }

        private static string FormatarStatusPedido(StatusPedido status)
        {
            return status switch
            {
                StatusPedido.Pendente => "Pendente",
                StatusPedido.Pago => "Pago",
                StatusPedido.Enviado => "Enviado",
                StatusPedido.Entregue => "Entregue",
                StatusPedido.Cancelado => "Cancelado",
                _ => status.ToString()
            };
        }

        private static string FormatarStatusVenda(StatusVenda status)
        {
            return status switch
            {
                StatusVenda.Criada => "Criada",
                StatusVenda.Paga => "Paga",
                StatusVenda.Enviada => "Enviada",
                StatusVenda.Concluida => "Concluida",
                StatusVenda.Cancelada => "Cancelada",
                StatusVenda.Pendente => "Pendente",
                StatusVenda.EmSeparacao => "Em separacao",
                StatusVenda.Pronto => "Pronto",
                _ => status.ToString()
            };
        }
    }
}
