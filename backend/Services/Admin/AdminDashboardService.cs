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

            var totalUsuariosTask = _context.TBL_USUARIO.AsNoTracking().CountAsync();
            var totalAdminsTask = _context.TBL_USUARIO
                .AsNoTracking()
                .CountAsync(u => u.Role == RolesSistema.Admin);
            var totalLojasTask = _context.TBL_LOJA.AsNoTracking().CountAsync();
            var totalLojasAtivasTask = _context.TBL_LOJA.AsNoTracking().CountAsync(l => l.Ativa);
            var totalProdutosTask = _context.TBL_PRODUTO.AsNoTracking().CountAsync();
            var produtosPublicadosTask = _context.TBL_PRODUTO
                .AsNoTracking()
                .CountAsync(p => p.StatusPublicacao == StatusProduto.Publicado);
            var totalPedidosTask = _context.TBL_PEDIDO.AsNoTracking().CountAsync();
            var pedidosPendentesTask = _context.TBL_PEDIDO
                .AsNoTracking()
                .CountAsync(p => p.StatusPedidosId == StatusPedido.Pendente);
            var pedidosPagosTask = _context.TBL_PEDIDO
                .AsNoTracking()
                .CountAsync(p =>
                    p.StatusPedidosId == StatusPedido.Pago ||
                    p.StatusPedidosId == StatusPedido.Enviado ||
                    p.StatusPedidosId == StatusPedido.Entregue);
            var receitaTotalMarketplaceTask = _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => StatusesComReceita.Contains(v.StatusVenda))
                .SumAsync(v => (decimal?)v.ValorBruto);
            var comissaoTotalMarketplaceTask = _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => StatusesComReceita.Contains(v.StatusVenda))
                .SumAsync(v => (decimal?)(v.ValorBruto - v.ValorLiquido));
            var ticketMedioPedidosTask = _context.TBL_PEDIDO
                .AsNoTracking()
                .Where(p => p.StatusPedidosId != StatusPedido.Cancelado)
                .AverageAsync(p => (decimal?)p.ValorTotalPedido);
            var totalVisualizacoesLojasTask = _context.TBL_LOJA
                .AsNoTracking()
                .SumAsync(l => (int?)l.TotalVisualizacoes);
            var totalVisualizacoesProdutosTask = _context.TBL_PRODUTO
                .AsNoTracking()
                .SumAsync(p => (int?)p.TotalVisualizacoes);

            var pedidosPorStatusTask = _context.TBL_PEDIDO
                .AsNoTracking()
                .GroupBy(p => p.StatusPedidosId)
                .Select(g => new
                {
                    Status = g.Key,
                    Total = g.Count(),
                    ValorTotal = g.Sum(p => p.ValorTotalPedido)
                })
                .ToListAsync();

            var vendasPorStatusTask = _context.TBL_VENDA
                .AsNoTracking()
                .GroupBy(v => v.StatusVenda)
                .Select(g => new
                {
                    Status = g.Key,
                    Total = g.Count(),
                    ValorTotal = g.Sum(v => v.ValorBruto)
                })
                .ToListAsync();

            var pedidosPorDiaTask = _context.TBL_PEDIDO
                .AsNoTracking()
                .Where(p => p.DataPedido >= inicioSerieUtc)
                .Select(p => new
                {
                    p.DataPedido,
                    p.ValorTotalPedido
                })
                .ToListAsync();

            var vendasPorDiaTask = _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => v.DataCriacao >= inicioSerieUtc && StatusesComReceita.Contains(v.StatusVenda))
                .Select(v => new
                {
                    v.DataCriacao,
                    v.ValorBruto
                })
                .ToListAsync();

            var produtosMaisVendidosTask = _context.TBL_ITENS_PEDIDO
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

            var produtosMaisVisualizadosTask = _context.TBL_PRODUTO
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

            var lojasMaisVisitadasTask = _context.TBL_LOJA
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

            var lojasComMaiorReceitaTask = _context.TBL_LOJA
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

            await Task.WhenAll(
                totalUsuariosTask,
                totalAdminsTask,
                totalLojasTask,
                totalLojasAtivasTask,
                totalProdutosTask,
                produtosPublicadosTask,
                totalPedidosTask,
                pedidosPendentesTask,
                pedidosPagosTask,
                receitaTotalMarketplaceTask,
                comissaoTotalMarketplaceTask,
                ticketMedioPedidosTask,
                totalVisualizacoesLojasTask,
                totalVisualizacoesProdutosTask,
                pedidosPorStatusTask,
                vendasPorStatusTask,
                pedidosPorDiaTask,
                vendasPorDiaTask,
                produtosMaisVendidosTask,
                produtosMaisVisualizadosTask,
                lojasMaisVisitadasTask,
                lojasComMaiorReceitaTask);

            var totalVisualizacoesLojas = totalVisualizacoesLojasTask.Result ?? 0;
            var totalVisualizacoesProdutos = totalVisualizacoesProdutosTask.Result ?? 0;

            return new AdminDashboardDto
            {
                TotalUsuarios = totalUsuariosTask.Result,
                TotalAdmins = totalAdminsTask.Result,
                TotalLojas = totalLojasTask.Result,
                TotalLojasAtivas = totalLojasAtivasTask.Result,
                TotalProdutos = totalProdutosTask.Result,
                ProdutosPublicados = produtosPublicadosTask.Result,
                TotalPedidos = totalPedidosTask.Result,
                PedidosPendentes = pedidosPendentesTask.Result,
                PedidosPagos = pedidosPagosTask.Result,
                ReceitaTotalMarketplace = receitaTotalMarketplaceTask.Result ?? 0m,
                ComissaoTotalMarketplace = comissaoTotalMarketplaceTask.Result ?? 0m,
                TicketMedioPedidos = ticketMedioPedidosTask.Result ?? 0m,
                TotalVisualizacoesLojas = totalVisualizacoesLojas,
                TotalVisualizacoesProdutos = totalVisualizacoesProdutos,
                TotalAcessosCatalogo = totalVisualizacoesLojas + totalVisualizacoesProdutos,
                PedidosPorStatus = pedidosPorStatusTask.Result
                    .Select(item => new AdminStatusResumoDto
                    {
                        Chave = item.Status.ToString(),
                        Label = FormatarStatusPedido(item.Status),
                        Total = item.Total,
                        ValorTotal = item.ValorTotal
                    })
                    .OrderByDescending(item => item.Total)
                    .ToList(),
                VendasPorStatus = vendasPorStatusTask.Result
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
                    pedidosPorDiaTask.Result.Select(p => p.DataPedido),
                    vendasPorDiaTask.Result.Select(v => (v.DataCriacao, v.ValorBruto))),
                PedidosPorDia = CriarSerieDiaria(
                    inicioSerieUtc,
                    pedidosPorDiaTask.Result.Select(p => p.DataPedido),
                    Enumerable.Empty<(DateTime Data, decimal Valor)>()),
                ProdutosMaisVendidos = produtosMaisVendidosTask.Result,
                ProdutosMaisVisualizados = produtosMaisVisualizadosTask.Result,
                LojasMaisVisitadas = lojasMaisVisitadasTask.Result,
                LojasComMaiorReceita = lojasComMaiorReceitaTask.Result
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
