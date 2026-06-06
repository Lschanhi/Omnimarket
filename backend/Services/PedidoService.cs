using Microsoft.EntityFrameworkCore;
using Omni.Models.Entidades;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models;
using Omnimarket.Api.Models.Dtos.Pedidos;
using Omnimarket.Api.Models.Dtos.Pedidos.ItemPedido;
using Omnimarket.Api.Models.Dtos.Produtos.Lojas;
using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class PedidoService
    {
        private static readonly StatusSolicitacaoCancelamento[] StatusesSolicitacaoCancelamentoAtiva =
        [
            StatusSolicitacaoCancelamento.Aberta,
            StatusSolicitacaoCancelamento.EmAnalise,
            StatusSolicitacaoCancelamento.Aprovada
        ];

        private readonly DataContext _context;
        private readonly FinanceiroService _financeiroService;

        public PedidoService(DataContext context, FinanceiroService financeiroService)
        {
            _context = context;
            _financeiroService = financeiroService;
        }

        public async Task<Pedido> CriarPedido(int usuarioId, PedidoDto dto)
        {
            if (!EntregaHelper.TipoEntregaValido(dto.TipoEntregaId))
                throw new Exception("Tipo de entrega invalido.");

            return await ExecutarComEstrategiaETransacaoAsync(async () =>
            {
                var usuarioExiste = await _context.TBL_USUARIO.AnyAsync(u => u.Id == usuarioId);
                if (!usuarioExiste)
                    throw new Exception("Usuario nao encontrado.");

                var enderecoEntrega = await ResolverEnderecoEntrega(usuarioId, dto.EnderecoId);
                var itensOrigem = await ResolverItensDoPedidoAsync(usuarioId, dto);

                var itensAgrupados = itensOrigem
                    .GroupBy(i => i.ProdutoId)
                    .Select(g => new ItemAgrupadoPedido(g.Key, g.Sum(x => x.Quantidade)))
                    .ToList();

                if (itensAgrupados.Count == 0 || itensAgrupados.Any(i => i.Quantidade <= 0))
                    throw new Exception("Quantidade invalida em um ou mais itens do pedido.");

                var produtoIds = itensAgrupados
                    .Select(i => i.ProdutoId)
                    .Distinct()
                    .ToList();

                var produtos = await _context.TBL_PRODUTO
                    .Include(p => p.Loja)
                    .Where(p => produtoIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                var pedido = new Pedido
                {
                    UsuarioId = usuarioId,
                    TipoLogradouroEntrega = EnumExtensions.GetDisplayName(enderecoEntrega.TipoLogradouro),
                    NomeEnderecoEntrega = enderecoEntrega.NomeEndereco,
                    NumeroEntrega = enderecoEntrega.Numero,
                    ComplementoEntrega = enderecoEntrega.Complemento,
                    CepEntrega = enderecoEntrega.Cep,
                    CidadeEntrega = enderecoEntrega.Cidade,
                    UfEntrega = enderecoEntrega.Uf,
                    TipoEntregaId = dto.TipoEntregaId,
                    Observacao = (dto.Observacao ?? string.Empty).Trim(),
                    StatusPedidosId = StatusPedido.Pendente,
                    DataPedido = DateTime.UtcNow
                };

                foreach (var item in itensAgrupados)
                {
                    if (!produtos.TryGetValue(item.ProdutoId, out var produto))
                        throw new Exception($"Produto {item.ProdutoId} nao encontrado.");

                    if (!produto.Loja.Ativa)
                        throw new Exception($"A loja do produto {item.ProdutoId} esta inativa.");

                    if (produto.Loja.UsuarioId == usuarioId)
                        throw new Exception($"Voce nao pode comprar o proprio produto {item.ProdutoId}.");

                    if (produto.StatusPublicacao != StatusProduto.Publicado)
                        throw new Exception($"Produto {item.ProdutoId} nao esta publicado para venda.");

                    if (produto.Estoque < item.Quantidade)
                        throw new Exception($"Estoque insuficiente para o produto {item.ProdutoId}.");

                    produto.Estoque -= item.Quantidade;

                    pedido.Itens.Add(new ItensPedido
                    {
                        ProdutoId = produto.Id,
                        Quantidade = item.Quantidade,
                        PrecoUnitario = produto.Preco,
                        ValorTotal = item.Quantidade * produto.Preco,
                        NomeProdutoSnapshot = produto.Nome,
                        NomeLojaSnapshot = produto.Loja.NomeFantasia,
                        DocumentoLojaSnapshot = produto.Loja.DocumentoFiscal,
                        TipoDocumentoLojaSnapshot = produto.Loja.TipoDocumentoFiscal.ToString()
                    });
                }

                pedido.ValorTotalProdutos = pedido.Itens.Sum(i => i.ValorTotal);
                pedido.ValorFrete = 0m;
                pedido.ValorTotalPedido = pedido.ValorTotalProdutos;

                await RemoverItensCompradosDoCarrinhoAsync(usuarioId, itensAgrupados);
                await _context.TBL_PEDIDO.AddAsync(pedido);
                await _context.SaveChangesAsync();

                return pedido;
            },
            () => new InvalidOperationException(
                "O estoque foi atualizado durante a finalizacao do pedido. Revise o carrinho e tente novamente."));
        }

        public async Task<PedidoLeituraDto?> BuscarPedido(int id, int usuarioId)
        {
            var pedido = await _context.TBL_PEDIDO
                .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
                .ThenInclude(produto => produto.Loja)
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

            if (pedido == null)
                return null;

            var possuiSolicitacaoCancelamentoAtiva = await ExisteSolicitacaoCancelamentoAtivaDoPedidoAsync(pedido.Id);

            return MapearPedido(pedido, possuiSolicitacaoCancelamentoAtiva);
        }

        public async Task<PageResult<LojaPedidoLeituraDto>> ListarPedidosDaLojaAsync(
            int lojaId,
            int vendedorId,
            string? busca,
            StatusPedido? statusPedido,
            StatusVenda? statusVenda,
            int page,
            int pageSize)
        {
            var query = _context.TBL_PEDIDO
                .AsNoTracking()
                .Where(p =>
                    p.Itens.Any(i => i.Produto.LojaId == lojaId) ||
                    _context.TBL_VENDA.Any(v => v.PedidoId == p.Id && v.VendedorId == vendedorId));

            if (!string.IsNullOrWhiteSpace(busca))
            {
                var termo = busca.Trim();
                var termoLike = $"%{termo}%";
                var buscaPedidoId = int.TryParse(termo, out var pedidoIdBusca) ? pedidoIdBusca : (int?)null;

                query = query.Where(p =>
                    (buscaPedidoId.HasValue && p.Id == buscaPedidoId.Value) ||
                    EF.Functions.Like(p.Usuario.Nome, termoLike) ||
                    EF.Functions.Like(p.Usuario.Sobrenome, termoLike) ||
                    EF.Functions.Like(p.Usuario.Email, termoLike) ||
                    EF.Functions.Like(p.CidadeEntrega, termoLike));
            }

            if (statusPedido.HasValue)
                query = query.Where(p => p.StatusPedidosId == statusPedido.Value);

            if (statusVenda.HasValue)
            {
                var statusVendasFiltro = VendaStatusHelper.ObterStatusPersistidosParaFiltro(statusVenda.Value);
                query = query.Where(p =>
                    _context.TBL_VENDA.Any(v =>
                        v.PedidoId == p.Id &&
                        v.VendedorId == vendedorId &&
                        statusVendasFiltro.Contains(v.StatusVenda)));
            }

            var pagina = NormalizarPagina(page);
            var tamanhoPagina = NormalizarTamanhoPagina(pageSize);
            var total = await query.CountAsync();

            var pedidoIds = await query
                .OrderByDescending(p => p.DataPedido)
                .ThenByDescending(p => p.Id)
                .Select(p => p.Id)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina)
                .ToListAsync();

            var items = await MapearPedidosDaLojaAsync(lojaId, vendedorId, pedidoIds);

            return new PageResult<LojaPedidoLeituraDto>
            {
                Items = items,
                Total = total,
                Page = pagina,
                PageSize = tamanhoPagina
            };
        }

        public async Task<LojaPedidoLeituraDto?> BuscarPedidoDaLojaAsync(int lojaId, int vendedorId, int pedidoId)
        {
            var pedidos = await MapearPedidosDaLojaAsync(lojaId, vendedorId, [pedidoId]);
            return pedidos.SingleOrDefault();
        }

        public async Task<List<PedidoLeituraDto>> ListarPedidosUsuario(int usuarioId)
        {
            var pedidos = await _context.TBL_PEDIDO
                .Where(p => p.UsuarioId == usuarioId)
                .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
                .ThenInclude(produto => produto.Loja)
                .OrderByDescending(p => p.DataPedido)
                .ToListAsync();

            var pedidoIds = pedidos.Select(p => p.Id).ToList();
            var pedidosComSolicitacaoAtiva = await BuscarPedidosComSolicitacaoCancelamentoAtivaAsync(pedidoIds);

            return pedidos
                .Select(p => MapearPedido(p, pedidosComSolicitacaoAtiva.Contains(p.Id)))
                .ToList();
        }

        public async Task<LojaPedidoLeituraDto?> AtualizarStatusPedidoDaLojaAsync(
            int lojaId,
            int vendedorId,
            int pedidoId,
            StatusVenda novoStatus)
        {
            var pedidoEncontrado = novoStatus switch
            {
                StatusVenda.EmSeparacao => await AceitarPedidoDaLojaAsync(lojaId, vendedorId, pedidoId),
                StatusVenda.Pronto => await MarcarPedidoDaLojaComoProntoAsync(lojaId, vendedorId, pedidoId),
                StatusVenda.Enviada => await MarcarPedidoDaLojaComoEnviadoAsync(lojaId, vendedorId, pedidoId),
                StatusVenda.Cancelada => await CancelarPedidoDaLojaAsync(lojaId, vendedorId, pedidoId),
                _ => throw new InvalidOperationException(
                    "A loja pode atualizar apenas para os status EmSeparacao, Pronto, Enviada ou Cancelada.")
            };

            if (!pedidoEncontrado)
                return null;

            return await BuscarPedidoDaLojaAsync(lojaId, vendedorId, pedidoId);
        }

        public async Task<bool> CancelarPedido(int pedidoId, int usuarioId)
        {
            return await ExecutarComEstrategiaETransacaoAsync(async () =>
            {
                var pedido = await _context.TBL_PEDIDO
                    .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                    .ThenInclude(produto => produto.Loja)
                    .FirstOrDefaultAsync(p => p.Id == pedidoId);

                if (pedido == null)
                    return false;

                if (pedido.UsuarioId != usuarioId)
                    throw new Exception("Voce nao pode cancelar pedidos que nao sao seus.");

                if (pedido.StatusPedidosId == StatusPedido.Cancelado)
                    throw new Exception("Este pedido ja esta cancelado.");

                if (pedido.StatusPedidosId == StatusPedido.Enviado)
                {
                    throw new Exception(
                        "Pedido enviado nao pode ser cancelado diretamente pelo cliente. Abra uma SolicitacaoCancelamento para tratar devolucao ou cancelamento.");
                }

                if (pedido.StatusPedidosId == StatusPedido.Entregue)
                {
                    throw new Exception(
                        "Pedido entregue nao pode ser cancelado diretamente. Abra uma SolicitacaoCancelamento para seguir o fluxo de devolucao.");
                }

                if (pedido.StatusPedidosId != StatusPedido.Pendente &&
                    pedido.StatusPedidosId != StatusPedido.Pago)
                {
                    throw new Exception("Somente pedidos pendentes ou pagos podem ser cancelados pelo cliente.");
                }

                await CancelarPedidoInternoAsync(
                    pedido,
                    usuarioId,
                    "cancelamento-cliente");

                return true;
            },
            () => new InvalidOperationException(
                "O estoque de um ou mais produtos foi alterado durante o cancelamento. Tente novamente."));
        }

        private async Task<bool> AceitarPedidoDaLojaAsync(int lojaId, int vendedorId, int pedidoId)
        {
            var venda = await BuscarVendaDaLojaParaAtualizacaoAsync(
                lojaId,
                vendedorId,
                pedidoId,
                "Somente pedidos pagos e pendentes de aceite podem entrar em separacao.");

            if (venda == null)
                return false;

            if (venda.Pedido.StatusPedidosId == StatusPedido.Cancelado || venda.StatusVenda == StatusVenda.Cancelada)
                throw new InvalidOperationException("Pedido cancelado nao pode ser aceito pela loja.");

            if (venda.Pedido.StatusPedidosId != StatusPedido.Pago)
                throw new InvalidOperationException("Somente pedidos pagos podem ser aceitos pela loja.");

            var statusAtual = VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda);

            if (statusAtual == StatusVenda.EmSeparacao)
                throw new InvalidOperationException("A sua loja ja colocou este pedido em separacao.");

            if (statusAtual == StatusVenda.Pronto)
                throw new InvalidOperationException("A sua loja ja marcou este pedido como pronto.");

            if (statusAtual == StatusVenda.Enviada)
                throw new InvalidOperationException("A sua loja ja marcou este pedido como enviado.");

            if (statusAtual == StatusVenda.Concluida)
                throw new InvalidOperationException("Pedido ja foi concluido para a sua loja.");

            if (statusAtual != StatusVenda.Pendente)
                throw new InvalidOperationException("Somente pedidos pendentes podem ser aceitos pela loja.");

            venda.StatusVenda = StatusVenda.EmSeparacao;
            venda.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> MarcarPedidoDaLojaComoProntoAsync(int lojaId, int vendedorId, int pedidoId)
        {
            var venda = await BuscarVendaDaLojaParaAtualizacaoAsync(
                lojaId,
                vendedorId,
                pedidoId,
                "Somente pedidos em separacao podem ser marcados como prontos.");

            if (venda == null)
                return false;

            if (venda.Pedido.StatusPedidosId == StatusPedido.Cancelado || venda.StatusVenda == StatusVenda.Cancelada)
                throw new InvalidOperationException("Pedido cancelado nao pode ser marcado como pronto pela loja.");

            var statusAtual = VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda);

            if (statusAtual == StatusVenda.Pronto)
                throw new InvalidOperationException("A sua loja ja marcou este pedido como pronto.");

            if (statusAtual == StatusVenda.Enviada)
                throw new InvalidOperationException("A sua loja ja marcou este pedido como enviado.");

            if (statusAtual == StatusVenda.Concluida)
                throw new InvalidOperationException("Pedido ja foi concluido para a sua loja.");

            if (statusAtual != StatusVenda.EmSeparacao)
                throw new InvalidOperationException("Somente pedidos em separacao podem ser marcados como prontos.");

            venda.StatusVenda = StatusVenda.Pronto;
            venda.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> MarcarPedidoDaLojaComoEnviadoAsync(int lojaId, int vendedorId, int pedidoId)
        {
            var venda = await BuscarVendaDaLojaParaAtualizacaoAsync(
                lojaId,
                vendedorId,
                pedidoId,
                "Somente pedidos prontos podem seguir para envio pela loja.");

            if (venda == null)
                return false;

            if (venda.Pedido.StatusPedidosId == StatusPedido.Cancelado || venda.StatusVenda == StatusVenda.Cancelada)
                throw new InvalidOperationException("Pedido cancelado nao pode ser enviado pela loja.");

            var statusAtual = VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda);

            if (statusAtual == StatusVenda.Enviada)
                throw new InvalidOperationException("A sua loja ja marcou este pedido como enviado.");

            if (statusAtual == StatusVenda.Concluida)
                throw new InvalidOperationException("Pedido ja foi concluido para a sua loja.");

            if (statusAtual != StatusVenda.Pronto)
                throw new InvalidOperationException("Somente pedidos prontos podem seguir para envio pela loja.");

            var agora = DateTime.UtcNow;
            venda.StatusVenda = StatusVenda.Enviada;
            venda.DataAtualizacao = agora;

            var vendasDoPedido = await _context.TBL_VENDA
                .Where(v => v.PedidoId == pedidoId)
                .ToListAsync();

            if (vendasDoPedido.All(v =>
                v.StatusVenda == StatusVenda.Enviada ||
                v.StatusVenda == StatusVenda.Concluida))
            {
                venda.Pedido.StatusPedidosId = StatusPedido.Enviado;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> CancelarPedidoDaLojaAsync(int lojaId, int vendedorId, int pedidoId)
        {
            return await ExecutarComEstrategiaETransacaoAsync(async () =>
            {
                var pedido = await _context.TBL_PEDIDO
                    .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                    .FirstOrDefaultAsync(p =>
                        p.Id == pedidoId &&
                        (p.Itens.Any(i => i.Produto.LojaId == lojaId) ||
                         _context.TBL_VENDA.Any(v => v.PedidoId == p.Id && v.VendedorId == vendedorId)));

                if (pedido == null)
                    return false;

                var venda = await _context.TBL_VENDA
                    .FirstOrDefaultAsync(v => v.PedidoId == pedidoId && v.VendedorId == vendedorId);

                if (pedido.StatusPedidosId == StatusPedido.Cancelado || venda?.StatusVenda == StatusVenda.Cancelada)
                    throw new InvalidOperationException("Este pedido ja esta cancelado.");

                if (pedido.Itens
                    .Where(i => i.Produto != null)
                    .Select(i => i.Produto.LojaId)
                    .Distinct()
                    .Count() > 1)
                {
                    throw new InvalidOperationException(
                        "Cancelamento pela loja ainda nao esta disponivel para pedidos com itens de outras lojas.");
                }

                if (pedido.StatusPedidosId == StatusPedido.Enviado ||
                    pedido.StatusPedidosId == StatusPedido.Entregue ||
                    VendaStatusHelper.ObterStatusOperacional(venda?.StatusVenda) == StatusVenda.Enviada ||
                    VendaStatusHelper.ObterStatusOperacional(venda?.StatusVenda) == StatusVenda.Concluida)
                {
                    throw new InvalidOperationException(
                        "Pedido enviado ou concluido nao pode ser cancelado diretamente pela loja. Use a SolicitacaoCancelamento para registrar e tratar o caso.");
                }

                if (pedido.StatusPedidosId != StatusPedido.Pendente &&
                    pedido.StatusPedidosId != StatusPedido.Pago)
                {
                    throw new InvalidOperationException(
                        "Somente pedidos pendentes ou pagos podem ser cancelados pela loja.");
                }

                await CancelarPedidoInternoAsync(
                    pedido,
                    vendedorId,
                    "cancelamento-loja");

                return true;
            },
            () => new InvalidOperationException(
                "O estoque de um ou mais produtos foi alterado durante o cancelamento. Tente novamente."));
        }

        public async Task<Pedido?> MarcarPedidoComoEnviadoAsync(int pedidoId)
        {
            var pedido = await _context.TBL_PEDIDO
                .FirstOrDefaultAsync(p => p.Id == pedidoId);

            if (pedido == null)
                return null;

            if (pedido.StatusPedidosId == StatusPedido.Cancelado)
                throw new InvalidOperationException("Pedido cancelado nao pode ser enviado.");

            if (pedido.StatusPedidosId == StatusPedido.Enviado)
                throw new InvalidOperationException("Pedido ja foi enviado.");

            if (pedido.StatusPedidosId == StatusPedido.Entregue)
                throw new InvalidOperationException("Pedido ja foi entregue.");

            if (pedido.StatusPedidosId != StatusPedido.Pago)
                throw new InvalidOperationException("Somente pedidos pagos podem seguir para envio.");

            var vendas = await _context.TBL_VENDA
                .Where(v => v.PedidoId == pedidoId)
                .ToListAsync();

            var agora = DateTime.UtcNow;

            foreach (var venda in vendas)
            {
                if (venda.StatusVenda == StatusVenda.Cancelada || venda.StatusVenda == StatusVenda.Concluida)
                    continue;

                venda.StatusVenda = StatusVenda.Enviada;
                venda.DataAtualizacao = agora;
            }

            pedido.StatusPedidosId = StatusPedido.Enviado;
            await _context.SaveChangesAsync();

            return pedido;
        }

        public async Task<Pedido?> ConfirmarEntregaPedidoAsync(int pedidoId, int usuarioId)
        {
            var pedido = await _context.TBL_PEDIDO
                .FirstOrDefaultAsync(p => p.Id == pedidoId && p.UsuarioId == usuarioId);

            if (pedido == null)
                return null;

            if (pedido.StatusPedidosId == StatusPedido.Cancelado)
                throw new InvalidOperationException("Pedido cancelado nao pode ser confirmado como entregue.");

            if (pedido.StatusPedidosId == StatusPedido.Entregue)
                throw new InvalidOperationException("Pedido ja foi entregue.");

            if (pedido.StatusPedidosId != StatusPedido.Enviado)
                throw new InvalidOperationException("Somente pedidos enviados podem ser confirmados como entregues.");

            if (await ExisteSolicitacaoCancelamentoAtivaDoPedidoAsync(pedidoId))
            {
                throw new InvalidOperationException(
                    "Existe uma SolicitacaoCancelamento ativa para este pedido. Resolva a tratativa antes de confirmar o recebimento.");
            }

            pedido.StatusPedidosId = StatusPedido.Entregue;

            var vendas = await _context.TBL_VENDA
                .Where(v => v.PedidoId == pedidoId)
                .ToListAsync();

            var agora = DateTime.UtcNow;

            foreach (var venda in vendas)
            {
                if (venda.StatusVenda == StatusVenda.Cancelada || venda.StatusVenda == StatusVenda.Concluida)
                    continue;

                venda.StatusVenda = StatusVenda.Concluida;
                venda.DataAtualizacao = agora;
            }

            await _context.SaveChangesAsync();

            return pedido;
        }

        private async Task<List<ItemPedidoDto>> ResolverItensDoPedidoAsync(int usuarioId, PedidoDto dto)
        {
            if (dto.Itens != null && dto.Itens.Count > 0)
                return dto.Itens;

            var carrinho = await _context.TBL_CARRINHO
                .AsNoTracking()
                .Include(c => c.Itens)
                .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId);

            if (carrinho == null || carrinho.Itens.Count == 0)
                throw new Exception("Nenhum item foi informado e o carrinho esta vazio.");

            return carrinho.Itens
                .Select(i => new ItemPedidoDto
                {
                    ProdutoId = i.ProdutoId,
                    Quantidade = i.Quantidade
                })
                .ToList();
        }

        private async Task RemoverItensCompradosDoCarrinhoAsync(
            int usuarioId,
            IReadOnlyCollection<ItemAgrupadoPedido> itensComprados)
        {
            var carrinho = await _context.TBL_CARRINHO
                .Include(c => c.Itens)
                .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId);

            if (carrinho == null)
                return;

            var itensPorProduto = itensComprados.ToDictionary(i => i.ProdutoId, i => i.Quantidade);

            var itensRemover = new List<ItemCarrinho>();

            foreach (var itemCarrinho in carrinho.Itens)
            {
                if (!itensPorProduto.TryGetValue(itemCarrinho.ProdutoId, out var quantidadeComprada))
                    continue;

                if (itemCarrinho.Quantidade <= quantidadeComprada)
                {
                    itensRemover.Add(itemCarrinho);
                    continue;
                }

                itemCarrinho.Quantidade -= quantidadeComprada;
            }

            if (itensRemover.Count > 0)
                _context.TBL_ITEM_CARRINHO.RemoveRange(itensRemover);
        }

        private async Task AtualizarStatusVendasDoPedidoAsync(int pedidoId, StatusVenda novoStatus)
        {
            var vendas = await _context.TBL_VENDA
                .Where(v => v.PedidoId == pedidoId)
                .ToListAsync();

            if (vendas.Count == 0)
                return;

            var agora = DateTime.UtcNow;

            foreach (var venda in vendas)
            {
                if (venda.StatusVenda != novoStatus)
                {
                    venda.StatusVenda = novoStatus;
                    venda.DataAtualizacao = agora;
                }
            }
        }

        private async Task CancelarPedidoInternoAsync(
            Pedido pedido,
            int usuarioResponsavelId,
            string origem)
        {
            foreach (var item in pedido.Itens)
            {
                if (item.Produto != null)
                    item.Produto.Estoque += item.Quantidade;
            }

            pedido.StatusPedidosId = StatusPedido.Cancelado;

            await _financeiroService.CancelarFluxoFinanceiroDoPedidoAsync(
                pedido.Id,
                usuarioResponsavelId,
                origem);

            await _context.SaveChangesAsync();
        }

        private async Task<Endereco> ResolverEnderecoEntrega(int usuarioId, int? enderecoId)
        {
            var query = _context.TBL_ENDERECO
                .AsNoTracking()
                .Where(e => e.UsuarioId == usuarioId && e.Ativo);

            if (enderecoId.HasValue && enderecoId.Value > 0)
            {
                var enderecoSelecionado = await query.FirstOrDefaultAsync(e => e.Id == enderecoId.Value);

                if (enderecoSelecionado == null)
                    throw new Exception("Endereco de entrega nao encontrado.");

                return enderecoSelecionado;
            }

            var enderecoPadrao = await query
                .OrderByDescending(e => e.IsPrincipal)
                .ThenBy(e => e.Id)
                .FirstOrDefaultAsync();

            if (enderecoPadrao == null)
                throw new Exception("Nenhum endereco de entrega foi encontrado para o usuario.");

            return enderecoPadrao;
        }

        private async Task<List<LojaPedidoLeituraDto>> MapearPedidosDaLojaAsync(
            int lojaId,
            int vendedorId,
            IReadOnlyCollection<int> pedidoIds)
        {
            if (pedidoIds.Count == 0)
                return [];

            var pedidos = await _context.TBL_PEDIDO
                .AsNoTracking()
                .Where(p => pedidoIds.Contains(p.Id))
                .Include(p => p.Usuario)
                .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
                .ToListAsync();

            var vendas = await _context.TBL_VENDA
                .AsNoTracking()
                .Where(v => pedidoIds.Contains(v.PedidoId) && v.VendedorId == vendedorId)
                .ToListAsync();

            var vendaIds = vendas.Select(v => v.Id).ToList();
            var vendasComSolicitacaoAtiva = await BuscarVendasComSolicitacaoCancelamentoAtivaAsync(vendaIds);

            var pedidosPorId = pedidos.ToDictionary(p => p.Id);
            var vendasPorPedidoId = vendas.ToDictionary(v => v.PedidoId);
            var resultados = new List<LojaPedidoLeituraDto>(pedidoIds.Count);

            foreach (var pedidoId in pedidoIds)
            {
                if (!pedidosPorId.TryGetValue(pedidoId, out var pedido))
                    continue;

                vendasPorPedidoId.TryGetValue(pedidoId, out var venda);
                var dto = MapearPedidoDaLoja(
                    pedido,
                    venda,
                    lojaId,
                    venda != null && vendasComSolicitacaoAtiva.Contains(venda.Id));

                if (dto != null)
                    resultados.Add(dto);
            }

            return resultados;
        }

        private static LojaPedidoLeituraDto? MapearPedidoDaLoja(
            Pedido pedido,
            Venda? venda,
            int lojaId,
            bool possuiSolicitacaoCancelamentoAtiva)
        {
            var itensDaLoja = pedido.Itens
                .Where(i => i.Produto?.LojaId == lojaId)
                .OrderBy(i => i.Id)
                .ToList();

            if (itensDaLoja.Count == 0)
                return null;

            var pedidoMultiloja = pedido.Itens
                .Where(i => i.Produto != null)
                .Select(i => i.Produto!.LojaId)
                .Distinct()
                .Count() > 1;

            var statusVenda = VendaStatusHelper.ObterStatusParaExibicao(venda?.StatusVenda);

            return new LojaPedidoLeituraDto
            {
                PedidoId = pedido.Id,
                VendaId = venda?.Id,
                LojaId = lojaId,
                NomeLoja = itensDaLoja[0].NomeLojaSnapshot,
                ClienteId = pedido.UsuarioId,
                NomeCliente = $"{pedido.Usuario.Nome} {pedido.Usuario.Sobrenome}".Trim(),
                EmailCliente = pedido.Usuario.Email,
                StatusPedido = pedido.StatusPedidosId,
                StatusVenda = statusVenda,
                TipoEntrega = EntregaHelper.ObterNomeTipoEntrega(pedido.TipoEntregaId),
                ValorTotalPedido = pedido.ValorTotalPedido,
                ValorTotalLoja = itensDaLoja.Sum(i => i.ValorTotal),
                QuantidadeItens = itensDaLoja.Sum(i => i.Quantidade),
                DataPedido = pedido.DataPedido,
                Observacao = pedido.Observacao,
                TipoLogradouroEntrega = pedido.TipoLogradouroEntrega,
                NomeEnderecoEntrega = pedido.NomeEnderecoEntrega,
                NumeroEntrega = pedido.NumeroEntrega,
                ComplementoEntrega = pedido.ComplementoEntrega,
                CepEntrega = pedido.CepEntrega,
                CidadeEntrega = pedido.CidadeEntrega,
                UfEntrega = pedido.UfEntrega,
                PedidoMultiloja = pedidoMultiloja,
                AguardandoConfirmacaoRecebimento = pedido.StatusPedidosId == StatusPedido.Enviado &&
                    statusVenda == StatusVenda.Enviada &&
                    !possuiSolicitacaoCancelamentoAtiva,
                PossuiSolicitacaoCancelamentoAtiva = possuiSolicitacaoCancelamentoAtiva,
                PodeCancelar = PodeLojaCancelarPedido(pedido, venda, pedidoMultiloja),
                PodeAceitar = PodeLojaAceitarPedido(pedido, venda),
                PodeMarcarComoPronto = PodeLojaMarcarPedidoComoPronto(pedido, venda),
                PodeMarcarComoEnviado = PodeLojaMarcarPedidoComoEnviado(pedido, venda),
                Itens = itensDaLoja
                    .Select(i => new LojaPedidoItemLeituraDto
                    {
                        Id = i.Id,
                        ProdutoId = i.ProdutoId,
                        NomeProduto = i.NomeProdutoSnapshot,
                        Quantidade = i.Quantidade,
                        PrecoUnitario = i.PrecoUnitario,
                        ValorTotal = i.ValorTotal
                    })
                    .ToList()
            };
        }

        private static bool PodeLojaCancelarPedido(Pedido pedido, Venda? venda, bool pedidoMultiloja)
        {
            if (pedidoMultiloja)
                return false;

            if (pedido.StatusPedidosId != StatusPedido.Pendente &&
                pedido.StatusPedidosId != StatusPedido.Pago)
            {
                return false;
            }

            return VendaStatusHelper.ObterStatusOperacional(venda?.StatusVenda) switch
            {
                StatusVenda.Enviada => false,
                StatusVenda.Concluida => false,
                StatusVenda.Cancelada => false,
                _ => true
            };
        }

        private static bool PodeLojaAceitarPedido(Pedido pedido, Venda? venda)
        {
            if (pedido.StatusPedidosId != StatusPedido.Pago || venda == null)
                return false;

            return VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda) == StatusVenda.Pendente;
        }

        private static bool PodeLojaMarcarPedidoComoPronto(Pedido pedido, Venda? venda)
        {
            if (pedido.StatusPedidosId == StatusPedido.Cancelado || venda == null)
                return false;

            return VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda) == StatusVenda.EmSeparacao;
        }

        private static bool PodeLojaMarcarPedidoComoEnviado(Pedido pedido, Venda? venda)
        {
            if (pedido.StatusPedidosId == StatusPedido.Cancelado || venda == null)
                return false;

            return VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda) == StatusVenda.Pronto;
        }

        private async Task<Venda?> BuscarVendaDaLojaParaAtualizacaoAsync(
            int lojaId,
            int vendedorId,
            int pedidoId,
            string mensagemQuandoSemVenda)
        {
            var venda = await _context.TBL_VENDA
                .Include(v => v.Pedido)
                .FirstOrDefaultAsync(v => v.PedidoId == pedidoId && v.VendedorId == vendedorId);

            if (venda != null)
                return venda;

            var pedidoPertenceLoja = await PedidoPertenceLojaAsync(pedidoId, lojaId, vendedorId);
            if (!pedidoPertenceLoja)
                return null;

            throw new InvalidOperationException(mensagemQuandoSemVenda);
        }

        private async Task<bool> PedidoPertenceLojaAsync(int pedidoId, int lojaId, int vendedorId)
        {
            return await _context.TBL_PEDIDO
                .AsNoTracking()
                .AnyAsync(p =>
                    p.Id == pedidoId &&
                    (p.Itens.Any(i => i.Produto.LojaId == lojaId) ||
                     _context.TBL_VENDA.Any(v => v.PedidoId == p.Id && v.VendedorId == vendedorId)));
        }

        private static int NormalizarPagina(int page)
            => page < 1 ? 1 : page;

        private static int NormalizarTamanhoPagina(int pageSize)
        {
            if (pageSize < 1)
                return 20;

            return pageSize > 100 ? 100 : pageSize;
        }

        private async Task<HashSet<int>> BuscarPedidosComSolicitacaoCancelamentoAtivaAsync(
            IReadOnlyCollection<int> pedidoIds)
        {
            if (pedidoIds.Count == 0)
                return [];

            var ids = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .AsNoTracking()
                .Where(s =>
                    pedidoIds.Contains(s.PedidoId) &&
                    StatusesSolicitacaoCancelamentoAtiva.Contains(s.Status))
                .Select(s => s.PedidoId)
                .Distinct()
                .ToListAsync();

            return ids.ToHashSet();
        }

        private async Task<HashSet<int>> BuscarVendasComSolicitacaoCancelamentoAtivaAsync(
            IReadOnlyCollection<int> vendaIds)
        {
            if (vendaIds.Count == 0)
                return [];

            var ids = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .AsNoTracking()
                .Where(s =>
                    vendaIds.Contains(s.VendaId) &&
                    StatusesSolicitacaoCancelamentoAtiva.Contains(s.Status))
                .Select(s => s.VendaId)
                .Distinct()
                .ToListAsync();

            return ids.ToHashSet();
        }

        private async Task<bool> ExisteSolicitacaoCancelamentoAtivaDoPedidoAsync(int pedidoId)
        {
            return await _context.TBL_SOLICITACAO_CANCELAMENTO
                .AsNoTracking()
                .AnyAsync(s =>
                    s.PedidoId == pedidoId &&
                    StatusesSolicitacaoCancelamentoAtiva.Contains(s.Status));
        }

        private static PedidoLeituraDto MapearPedido(
            Pedido pedido,
            bool possuiSolicitacaoCancelamentoAtiva)
        {
            return new PedidoLeituraDto
            {
                Id = pedido.Id,
                Status = pedido.StatusPedidosId,
                TipoEntrega = EntregaHelper.ObterNomeTipoEntrega(pedido.TipoEntregaId),
                ValorTotalProdutos = pedido.ValorTotalProdutos,
                ValorFrete = pedido.ValorFrete,
                ValorTotalPedido = pedido.ValorTotalPedido,
                DataPedido = pedido.DataPedido,
                Observacao = pedido.Observacao,
                TipoLogradouroEntrega = pedido.TipoLogradouroEntrega,
                NomeEnderecoEntrega = pedido.NomeEnderecoEntrega,
                NumeroEntrega = pedido.NumeroEntrega,
                ComplementoEntrega = pedido.ComplementoEntrega,
                CepEntrega = pedido.CepEntrega,
                CidadeEntrega = pedido.CidadeEntrega,
                UfEntrega = pedido.UfEntrega,
                PodeConfirmarRecebimento = pedido.StatusPedidosId == StatusPedido.Enviado &&
                    !possuiSolicitacaoCancelamentoAtiva,
                PossuiSolicitacaoCancelamentoAtiva = possuiSolicitacaoCancelamentoAtiva,
                Itens = pedido.Itens
                    .OrderBy(i => i.Id)
                    .Select(i => new ItemPedidoLeituraDto
                    {
                        Id = i.Id,
                        ProdutoId = i.ProdutoId,
                        NomeProduto = i.Produto?.Nome ?? string.Empty,
                        LojaId = i.Produto?.LojaId ?? 0,
                        NomeLoja = i.Produto?.Loja?.NomeFantasia ?? string.Empty,
                        Quantidade = i.Quantidade,
                        PrecoUnitario = i.PrecoUnitario,
                        ValorTotal = i.ValorTotal
                    })
                    .ToList()
            };
        }

        private async Task<T> ExecutarComEstrategiaETransacaoAsync<T>(
            Func<Task<T>> operacao,
            Func<InvalidOperationException>? criarErroConcorrencia = null)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var resultado = await operacao();
                    await transaction.CommitAsync();
                    return resultado;
                }
                catch (DbUpdateConcurrencyException) when (criarErroConcorrencia != null)
                {
                    await transaction.RollbackAsync();
                    throw criarErroConcorrencia();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        private sealed record ItemAgrupadoPedido(int ProdutoId, int Quantidade);
    }
}
