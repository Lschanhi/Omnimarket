using Microsoft.EntityFrameworkCore;
using Omnimarket.Api.Data;
using Omnimarket.Api.Extensions;
using Omnimarket.Api.Models.Dtos.Pedidos;
using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class SolicitacaoCancelamentoService
    {
        private static readonly StatusSolicitacaoCancelamento[] StatusesAtivos =
        [
            StatusSolicitacaoCancelamento.Aberta,
            StatusSolicitacaoCancelamento.EmAnalise,
            StatusSolicitacaoCancelamento.Aprovada
        ];

        private static readonly MotivoSolicitacaoCancelamento[] MotivosCancelamento =
        [
            MotivoSolicitacaoCancelamento.Arrependimento,
            MotivoSolicitacaoCancelamento.Outro
        ];

        private static readonly MotivoSolicitacaoCancelamento[] MotivosDevolucao =
        [
            MotivoSolicitacaoCancelamento.Arrependimento,
            MotivoSolicitacaoCancelamento.ProdutoComDefeito,
            MotivoSolicitacaoCancelamento.ProdutoIncorreto,
            MotivoSolicitacaoCancelamento.Outro
        ];

        private static readonly MotivoSolicitacaoCancelamento[] MotivosTroca =
        [
            MotivoSolicitacaoCancelamento.ProdutoComDefeito,
            MotivoSolicitacaoCancelamento.ProdutoIncorreto,
            MotivoSolicitacaoCancelamento.Outro
        ];

        private static readonly MotivoSolicitacaoCancelamento[] MotivosProblemaEntrega =
        [
            MotivoSolicitacaoCancelamento.AtrasoEntrega,
            MotivoSolicitacaoCancelamento.EntregaNaoRecebida,
            MotivoSolicitacaoCancelamento.Outro
        ];

        private readonly DataContext _context;
        private readonly FinanceiroService _financeiroService;

        public SolicitacaoCancelamentoService(DataContext context, FinanceiroService financeiroService)
        {
            _context = context;
            _financeiroService = financeiroService;
        }

        public async Task<SolicitacaoCancelamentoLeituraDto?> CriarAsync(
            int pedidoId,
            int compradorId,
            SolicitacaoCancelamentoCriacaoDto dto)
        {
            var pedido = await _context.TBL_PEDIDO
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == pedidoId && p.UsuarioId == compradorId);

            if (pedido == null)
                return null;

            var venda = await ResolverVendaAsync(pedidoId, dto.VendaId);
            var statusVendaOperacional = VendaStatusHelper.ObterStatusOperacional(venda.StatusVenda);

            if (statusVendaOperacional == StatusVenda.Cancelada)
                throw new InvalidOperationException("A venda selecionada ja esta cancelada.");

            if (statusVendaOperacional == StatusVenda.Criada)
                throw new InvalidOperationException("A venda ainda nao foi confirmada para essa loja.");

            var tipoSolicitacao = ResolverTipoSolicitacao(pedido.StatusPedidosId, dto);

            ValidarCriacao(tipoSolicitacao, pedido.StatusPedidosId, statusVendaOperacional, dto.Motivo);

            var existeSolicitacaoAtiva = await _context.TBL_SOLICITACAO_CANCELAMENTO.AnyAsync(s =>
                s.VendaId == venda.Id &&
                StatusesAtivos.Contains(s.Status));

            if (existeSolicitacaoAtiva)
                throw new InvalidOperationException("Ja existe uma solicitacao ativa para esta venda.");

            var solicitacao = new SolicitacaoCancelamento
            {
                PedidoId = pedidoId,
                VendaId = venda.Id,
                SolicitanteId = compradorId,
                TipoSolicitacao = tipoSolicitacao,
                Motivo = dto.Motivo,
                Status = StatusSolicitacaoCancelamento.Aberta,
                StatusPedidoOrigem = venda.Pedido.StatusPedidosId,
                StatusVendaOrigem = statusVendaOperacional,
                Observacao = (dto.Observacao ?? string.Empty).Trim(),
                DataCriacao = DateTime.UtcNow
            };

            _context.TBL_SOLICITACAO_CANCELAMENTO.Add(solicitacao);
            await _context.SaveChangesAsync();

            return await BuscarParaCompradorAsync(solicitacao.Id, compradorId);
        }

        public async Task<List<SolicitacaoCancelamentoLeituraDto>> ListarDoPedidoAsync(int pedidoId, int compradorId)
        {
            var pedidoPertenceAoComprador = await _context.TBL_PEDIDO
                .AsNoTracking()
                .AnyAsync(p => p.Id == pedidoId && p.UsuarioId == compradorId);

            if (!pedidoPertenceAoComprador)
                return [];

            var solicitacoes = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .AsNoTracking()
                .Include(s => s.Pedido)
                .ThenInclude(p => p.Usuario)
                .Include(s => s.Venda)
                .ThenInclude(v => v.Vendedor)
                .ThenInclude(u => u.Loja)
                .Where(s => s.PedidoId == pedidoId && s.SolicitanteId == compradorId)
                .OrderByDescending(s => s.DataCriacao)
                .ToListAsync();

            return solicitacoes.Select(Mapear).ToList();
        }

        public async Task<SolicitacaoCancelamentoLeituraDto?> CancelarPeloCompradorAsync(
            int solicitacaoId,
            int compradorId)
        {
            var solicitacao = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .Include(s => s.Pedido)
                .Include(s => s.Venda)
                .ThenInclude(v => v.Vendedor)
                .ThenInclude(u => u.Loja)
                .FirstOrDefaultAsync(s => s.Id == solicitacaoId && s.SolicitanteId == compradorId);

            if (solicitacao == null)
                return null;

            if (solicitacao.Status != StatusSolicitacaoCancelamento.Aberta &&
                solicitacao.Status != StatusSolicitacaoCancelamento.EmAnalise)
            {
                throw new InvalidOperationException(
                    "Somente solicitacoes abertas ou em analise podem ser canceladas pelo solicitante.");
            }

            solicitacao.Status = StatusSolicitacaoCancelamento.Cancelada;
            solicitacao.DataAtualizacao = DateTime.UtcNow;
            solicitacao.DataConclusao = solicitacao.DataAtualizacao;

            await _context.SaveChangesAsync();

            return Mapear(solicitacao);
        }

        public async Task<PageResult<SolicitacaoCancelamentoLeituraDto>> ListarDaLojaAsync(
            int lojaId,
            int vendedorId,
            StatusSolicitacaoCancelamento? status,
            int page,
            int pageSize)
        {
            var query = _context.TBL_SOLICITACAO_CANCELAMENTO
                .AsNoTracking()
                .Include(s => s.Pedido)
                .ThenInclude(p => p.Usuario)
                .Include(s => s.Venda)
                .ThenInclude(v => v.Vendedor)
                .ThenInclude(u => u.Loja)
                .Where(s =>
                    s.Venda.VendedorId == vendedorId &&
                    s.Venda.Vendedor.Loja != null &&
                    s.Venda.Vendedor.Loja.Id == lojaId);

            if (status.HasValue)
                query = query.Where(s => s.Status == status.Value);

            var pagina = await query
                .OrderByDescending(s => s.DataCriacao)
                .ToPagedResultAsync(page, pageSize);

            return new PageResult<SolicitacaoCancelamentoLeituraDto>
            {
                Items = pagina.Items.Select(Mapear).ToList(),
                Total = pagina.Total,
                Page = pagina.Page,
                PageSize = pagina.PageSize
            };
        }

        public async Task<SolicitacaoCancelamentoLeituraDto?> AtualizarStatusDaLojaAsync(
            int lojaId,
            int vendedorId,
            int solicitacaoId,
            SolicitacaoCancelamentoAtualizacaoDto dto)
        {
            var solicitacao = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .Include(s => s.Pedido)
                .ThenInclude(p => p.Usuario)
                .Include(s => s.Pedido)
                .ThenInclude(p => p.Itens)
                .ThenInclude(i => i.Produto)
                .Include(s => s.Venda)
                .ThenInclude(v => v.Vendedor)
                .ThenInclude(u => u.Loja)
                .FirstOrDefaultAsync(s =>
                    s.Id == solicitacaoId &&
                    s.Venda.VendedorId == vendedorId &&
                    s.Venda.Vendedor.Loja != null &&
                    s.Venda.Vendedor.Loja.Id == lojaId);

            if (solicitacao == null)
                return null;

            ValidarTransicao(solicitacao.Status, dto.Status);

            var agora = DateTime.UtcNow;

            if (dto.Status == StatusSolicitacaoCancelamento.EmAnalise ||
                dto.Status == StatusSolicitacaoCancelamento.Aprovada ||
                dto.Status == StatusSolicitacaoCancelamento.Recusada)
            {
                solicitacao.ResponsavelAnaliseId = vendedorId;
                solicitacao.DataAnalise ??= agora;
            }

            solicitacao.Status = dto.Status;
            solicitacao.ObservacaoAnalise = string.IsNullOrWhiteSpace(dto.ObservacaoAnalise)
                ? solicitacao.ObservacaoAnalise
                : dto.ObservacaoAnalise.Trim();
            solicitacao.DataAtualizacao = agora;

            if (dto.Status == StatusSolicitacaoCancelamento.Concluida)
            {
                await AplicarConclusaoAsync(solicitacao, vendedorId, agora);
            }

            if (dto.Status == StatusSolicitacaoCancelamento.Recusada ||
                dto.Status == StatusSolicitacaoCancelamento.Cancelada ||
                dto.Status == StatusSolicitacaoCancelamento.Concluida)
            {
                solicitacao.DataConclusao = agora;
            }

            await _context.SaveChangesAsync();

            return Mapear(solicitacao);
        }

        private async Task AplicarConclusaoAsync(
            SolicitacaoCancelamento solicitacao,
            int usuarioResponsavelId,
            DateTime dataConclusao)
        {
            if (solicitacao.TipoSolicitacao != TipoSolicitacaoPedido.Cancelamento &&
                solicitacao.TipoSolicitacao != TipoSolicitacaoPedido.Devolucao)
            {
                return;
            }

            var pedidoMultiloja = solicitacao.Pedido.Itens
                .Where(item => item.Produto != null)
                .Select(item => item.Produto!.LojaId)
                .Distinct()
                .Count() > 1;

            if (pedidoMultiloja)
            {
                throw new InvalidOperationException(
                    "A conclusao com estorno automatico ainda nao esta disponivel para pedidos com itens de outras lojas.");
            }

            foreach (var item in solicitacao.Pedido.Itens)
            {
                if (item.Produto != null)
                    item.Produto.Estoque += item.Quantidade;
            }

            solicitacao.Pedido.StatusPedidosId = StatusPedido.Cancelado;
            solicitacao.Venda.StatusVenda = StatusVenda.Cancelada;
            solicitacao.Venda.DataAtualizacao = dataConclusao;

            await _financeiroService.CancelarFluxoFinanceiroDoPedidoAsync(
                solicitacao.PedidoId,
                usuarioResponsavelId,
                $"solicitacao-{solicitacao.TipoSolicitacao.ToString().ToLowerInvariant()}");
        }

        private async Task<SolicitacaoCancelamentoLeituraDto?> BuscarParaCompradorAsync(int solicitacaoId, int compradorId)
        {
            var solicitacao = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .AsNoTracking()
                .Include(s => s.Pedido)
                .ThenInclude(p => p.Usuario)
                .Include(s => s.Venda)
                .ThenInclude(v => v.Vendedor)
                .ThenInclude(u => u.Loja)
                .FirstOrDefaultAsync(s => s.Id == solicitacaoId && s.SolicitanteId == compradorId);

            return solicitacao == null ? null : Mapear(solicitacao);
        }

        private async Task<Venda> ResolverVendaAsync(int pedidoId, int? vendaId)
        {
            var vendas = await _context.TBL_VENDA
                .Include(v => v.Pedido)
                .Where(v => v.PedidoId == pedidoId)
                .OrderBy(v => v.Id)
                .ToListAsync();

            if (vendas.Count == 0)
                throw new InvalidOperationException("Este pedido ainda nao possui venda confirmada para abrir solicitacao.");

            if (vendaId.HasValue)
            {
                var vendaSelecionada = vendas.FirstOrDefault(v => v.Id == vendaId.Value);

                return vendaSelecionada ?? throw new InvalidOperationException(
                    "A venda informada nao pertence a este pedido.");
            }

            if (vendas.Count > 1)
            {
                throw new InvalidOperationException(
                    "Este pedido possui mais de uma venda. Informe a venda especifica para abrir a solicitacao.");
            }

            return vendas[0];
        }

        private static TipoSolicitacaoPedido ResolverTipoSolicitacao(
            StatusPedido statusPedidoAtual,
            SolicitacaoCancelamentoCriacaoDto dto)
        {
            if (dto.TipoSolicitacao.HasValue)
                return dto.TipoSolicitacao.Value;

            if (statusPedidoAtual == StatusPedido.Entregue)
                return TipoSolicitacaoPedido.Devolucao;

            return TipoSolicitacaoPedido.Cancelamento;
        }

        private static void ValidarCriacao(
            TipoSolicitacaoPedido tipoSolicitacao,
            StatusPedido statusPedidoAtual,
            StatusVenda statusVendaOperacional,
            MotivoSolicitacaoCancelamento motivo)
        {
            switch (tipoSolicitacao)
            {
                case TipoSolicitacaoPedido.Cancelamento:
                    if (statusVendaOperacional == StatusVenda.Pendente ||
                        statusVendaOperacional == StatusVenda.EmSeparacao ||
                        statusVendaOperacional == StatusVenda.Pronto)
                    {
                        throw new InvalidOperationException(
                            "Enquanto o pedido ainda nao foi enviado, use o cancelamento direto em vez de abrir uma solicitacao.");
                    }

                    if (statusPedidoAtual == StatusPedido.Entregue)
                    {
                        throw new InvalidOperationException(
                            "Pedido entregue deve seguir como devolucao ou troca em vez de cancelamento.");
                    }

                    if (!MotivosCancelamento.Contains(motivo))
                    {
                        throw new InvalidOperationException(
                            "Cancelamentos aceitam arrependimento ou outro motivo informado pelo comprador.");
                    }

                    break;

                case TipoSolicitacaoPedido.Devolucao:
                    if (statusPedidoAtual != StatusPedido.Entregue)
                    {
                        throw new InvalidOperationException(
                            "A devolucao fica disponivel somente depois que o pedido for entregue.");
                    }

                    if (!MotivosDevolucao.Contains(motivo))
                    {
                        throw new InvalidOperationException(
                            "A devolucao aceita arrependimento, produto com defeito, produto incorreto ou outro motivo.");
                    }

                    break;

                case TipoSolicitacaoPedido.Troca:
                    if (statusPedidoAtual != StatusPedido.Entregue)
                    {
                        throw new InvalidOperationException(
                            "A troca fica disponivel somente depois que o pedido for entregue.");
                    }

                    if (!MotivosTroca.Contains(motivo))
                    {
                        throw new InvalidOperationException(
                            "A troca aceita produto com defeito, produto incorreto ou outro motivo.");
                    }

                    break;

                case TipoSolicitacaoPedido.ProblemaEntrega:
                    if (statusPedidoAtual != StatusPedido.Enviado)
                    {
                        throw new InvalidOperationException(
                            "Problemas de entrega podem ser abertos somente quando o pedido estiver enviado e ainda nao tiver sido confirmado como entregue.");
                    }

                    if (!MotivosProblemaEntrega.Contains(motivo))
                    {
                        throw new InvalidOperationException(
                            "Use atraso na entrega, entrega nao recebida ou outro motivo para problemas de entrega.");
                    }

                    break;

                default:
                    throw new InvalidOperationException("Tipo de solicitacao nao suportado.");
            }
        }

        private static void ValidarTransicao(
            StatusSolicitacaoCancelamento statusAtual,
            StatusSolicitacaoCancelamento novoStatus)
        {
            if (novoStatus == StatusSolicitacaoCancelamento.Cancelada)
            {
                throw new InvalidOperationException(
                    "A loja nao pode cancelar a solicitacao. Esse cancelamento deve partir do solicitante.");
            }

            var permitido = statusAtual switch
            {
                StatusSolicitacaoCancelamento.Aberta => novoStatus == StatusSolicitacaoCancelamento.EmAnalise ||
                    novoStatus == StatusSolicitacaoCancelamento.Aprovada ||
                    novoStatus == StatusSolicitacaoCancelamento.Recusada,
                StatusSolicitacaoCancelamento.EmAnalise => novoStatus == StatusSolicitacaoCancelamento.Aprovada ||
                    novoStatus == StatusSolicitacaoCancelamento.Recusada,
                StatusSolicitacaoCancelamento.Aprovada => novoStatus == StatusSolicitacaoCancelamento.Concluida,
                _ => false
            };

            if (!permitido)
            {
                throw new InvalidOperationException(
                    $"Nao e permitido mover a solicitacao de {statusAtual} para {novoStatus}.");
            }
        }

        private static SolicitacaoCancelamentoLeituraDto Mapear(SolicitacaoCancelamento solicitacao)
        {
            var loja = solicitacao.Venda.Vendedor.Loja;

            return new SolicitacaoCancelamentoLeituraDto
            {
                Id = solicitacao.Id,
                PedidoId = solicitacao.PedidoId,
                VendaId = solicitacao.VendaId,
                ClienteId = solicitacao.Pedido.UsuarioId,
                NomeCliente = (solicitacao.Pedido.Usuario.Nome + " " + solicitacao.Pedido.Usuario.Sobrenome).Trim(),
                EmailCliente = solicitacao.Pedido.Usuario.Email,
                VendedorId = solicitacao.Venda.VendedorId,
                LojaId = loja?.Id ?? 0,
                NomeLoja = loja?.NomeFantasia ?? string.Empty,
                StatusPedidoAtual = solicitacao.Pedido.StatusPedidosId,
                StatusVendaAtual = VendaStatusHelper.ObterStatusOperacional(solicitacao.Venda.StatusVenda),
                StatusPedidoOrigem = solicitacao.StatusPedidoOrigem,
                StatusVendaOrigem = solicitacao.StatusVendaOrigem,
                TipoSolicitacao = solicitacao.TipoSolicitacao,
                Motivo = solicitacao.Motivo,
                Status = solicitacao.Status,
                Observacao = solicitacao.Observacao,
                ObservacaoAnalise = solicitacao.ObservacaoAnalise,
                DataCriacao = solicitacao.DataCriacao,
                DataAtualizacao = solicitacao.DataAtualizacao,
                DataAnalise = solicitacao.DataAnalise,
                DataConclusao = solicitacao.DataConclusao,
                PodeCancelarPeloSolicitante = solicitacao.Status == StatusSolicitacaoCancelamento.Aberta ||
                    solicitacao.Status == StatusSolicitacaoCancelamento.EmAnalise,
                PodeColocarEmAnalise = solicitacao.Status == StatusSolicitacaoCancelamento.Aberta,
                PodeAprovar = solicitacao.Status == StatusSolicitacaoCancelamento.Aberta ||
                    solicitacao.Status == StatusSolicitacaoCancelamento.EmAnalise,
                PodeRecusar = solicitacao.Status == StatusSolicitacaoCancelamento.Aberta ||
                    solicitacao.Status == StatusSolicitacaoCancelamento.EmAnalise,
                PodeConcluir = solicitacao.Status == StatusSolicitacaoCancelamento.Aprovada
            };
        }
    }
}
