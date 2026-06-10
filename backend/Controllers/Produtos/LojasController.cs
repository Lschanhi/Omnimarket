using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Models.Dtos.Pedidos;
using Omnimarket.Api.Models.Dtos.Produtos.Lojas;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Route("api/lojas")]
    public class LojasController : ControllerBase
    {
        private readonly AvaliacaoProdutoService _avaliacaoProdutoService;
        private readonly LojaService _lojaService;
        private readonly PedidoService _pedidoService;
        private readonly ReciboPedidoService _reciboPedidoService;
        private readonly SolicitacaoCancelamentoService _solicitacaoCancelamentoService;

        public LojasController(
            AvaliacaoProdutoService avaliacaoProdutoService,
            LojaService lojaService,
            PedidoService pedidoService,
            ReciboPedidoService reciboPedidoService,
            SolicitacaoCancelamentoService solicitacaoCancelamentoService)
        {
            _avaliacaoProdutoService = avaliacaoProdutoService;
            _lojaService = lojaService;
            _pedidoService = pedidoService;
            _reciboPedidoService = reciboPedidoService;
            _solicitacaoCancelamentoService = solicitacaoCancelamentoService;
        }

        // Retorna a loja vinculada ao usuario autenticado.
        [Authorize]
        [HttpGet("minha")]
        public async Task<IActionResult> ObterMinhaLoja()
        {
            var usuarioId = User.GetUserId();
            var loja = await _lojaService.ObterMinhaLojaAsync(usuarioId);

            if (loja == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            return Ok(loja);
        }

        [Authorize]
        [HttpGet("minha/metricas")]
        public async Task<IActionResult> ObterMinhasMetricas()
        {
            var usuarioId = User.GetUserId();
            var metricas = await _lojaService.ObterMinhasMetricasAsync(usuarioId);

            if (metricas == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            return Ok(metricas);
        }

        [Authorize]
        [HttpGet("minha/pedidos")]
        public async Task<IActionResult> ListarPedidosDaMinhaLoja(
            [FromQuery] string? busca,
            [FromQuery] StatusPedido? statusPedido,
            [FromQuery] StatusVenda? statusVenda,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var usuarioId = User.GetUserId();
            var loja = await _lojaService.ObterMinhaLojaAsync(usuarioId);

            if (loja == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            var pedidos = await _pedidoService.ListarPedidosDaLojaAsync(
                loja.Id,
                usuarioId,
                busca,
                statusPedido,
                statusVenda,
                page,
                pageSize);

            return Ok(pedidos);
        }

        [Authorize]
        [HttpGet("minha/pedidos/{pedidoId:int}")]
        public async Task<IActionResult> BuscarPedidoDaMinhaLoja(int pedidoId)
        {
            var usuarioId = User.GetUserId();
            var loja = await _lojaService.ObterMinhaLojaAsync(usuarioId);

            if (loja == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            var pedido = await _pedidoService.BuscarPedidoDaLojaAsync(loja.Id, usuarioId, pedidoId);

            if (pedido == null)
                return NotFound(new { mensagem = "Pedido nao encontrado para a sua loja." });

            return Ok(pedido);
        }

        [Authorize]
        [HttpPut("minha/pedidos/{pedidoId:int}/status")]
        public async Task<IActionResult> AtualizarStatusPedidoDaMinhaLoja(
            int pedidoId,
            [FromBody] LojaAtualizarStatusPedidoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var usuarioId = User.GetUserId();
            var loja = await _lojaService.ObterMinhaLojaAsync(usuarioId);

            if (loja == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            try
            {
                var pedido = await _pedidoService.AtualizarStatusPedidoDaLojaAsync(
                    loja.Id,
                    usuarioId,
                    pedidoId,
                    dto.StatusVenda);

                if (pedido == null)
                    return NotFound(new { mensagem = "Pedido nao encontrado para a sua loja." });

                var mensagem = dto.StatusVenda switch
                {
                    StatusVenda.EmSeparacao => "Pedido aceito e movido para separacao com sucesso pela loja!",
                    StatusVenda.Pronto => "Pedido marcado como pronto com sucesso pela loja!",
                    StatusVenda.Enviada => "Pedido marcado como enviado com sucesso pela loja!",
                    StatusVenda.Cancelada => "Pedido cancelado com sucesso pela loja!",
                    _ => "Status atualizado com sucesso pela loja!"
                };

                return Ok(new
                {
                    mensagem,
                    pedido
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("minha/pedidos/{pedidoId:int}/recibo")]
        public async Task<IActionResult> BaixarReciboPedidoLoja(int pedidoId)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var pdf = await _reciboPedidoService.GerarReciboPedidoParaVendedorAsync(pedidoId, usuarioId);

                if (pdf == null)
                    return NotFound(new { mensagem = "Pedido nao encontrado para a sua loja." });

                return File(
                    pdf,
                    "application/pdf",
                    $"recibo-pedido-{pedidoId}-loja.pdf");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("minha/solicitacoes-cancelamento")]
        [HttpGet("minha/solicitacoes-pedido")]
        public async Task<IActionResult> ListarSolicitacoesCancelamentoDaMinhaLoja(
            [FromQuery] StatusSolicitacaoCancelamento? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var usuarioId = User.GetUserId();
            var loja = await _lojaService.ObterMinhaLojaAsync(usuarioId);

            if (loja == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            var solicitacoes = await _solicitacaoCancelamentoService.ListarDaLojaAsync(
                loja.Id,
                usuarioId,
                status,
                page,
                pageSize);

            return Ok(solicitacoes);
        }

        [Authorize]
        [HttpPut("minha/solicitacoes-cancelamento/{solicitacaoId:int}/status")]
        [HttpPut("minha/solicitacoes-pedido/{solicitacaoId:int}/status")]
        public async Task<IActionResult> AtualizarStatusSolicitacaoCancelamentoDaMinhaLoja(
            int solicitacaoId,
            [FromBody] SolicitacaoCancelamentoAtualizacaoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var usuarioId = User.GetUserId();
            var loja = await _lojaService.ObterMinhaLojaAsync(usuarioId);

            if (loja == null)
                return NotFound(new { mensagem = "Loja ainda nao cadastrada para este usuario." });

            try
            {
                var solicitacao = await _solicitacaoCancelamentoService.AtualizarStatusDaLojaAsync(
                    loja.Id,
                    usuarioId,
                    solicitacaoId,
                    dto);

                if (solicitacao == null)
                    return NotFound(new { mensagem = "Solicitacao do pedido nao encontrada para a sua loja." });

                return Ok(new
                {
                    mensagem = "Solicitacao do pedido atualizada com sucesso!",
                    solicitacao
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{lojaId:int}/avaliacoes")]
        public async Task<IActionResult> ListarAvaliacoes(
            int lojaId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var avaliacoes = await _avaliacaoProdutoService.ListarPorLojaAsync(lojaId, page, pageSize);

            return Ok(avaliacoes);
        }

        // Cria a loja do usuario autenticado.
        [Authorize]
        [HttpPost("minha")]
        public async Task<IActionResult> CriarMinhaLoja([FromBody] LojaCriacaoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var usuarioId = User.GetUserId();
                var loja = await _lojaService.CriarMinhaLojaAsync(usuarioId, dto);

                return CreatedAtAction(nameof(ObterPorId), new { id = loja.Id }, loja);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        // Atualiza a loja do usuario autenticado.
        [Authorize]
        [HttpPut("minha")]
        public async Task<IActionResult> AtualizarMinhaLoja([FromBody] LojaAtualizacaoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var usuarioId = User.GetUserId();
                var loja = await _lojaService.AtualizarMinhaLojaAsync(usuarioId, dto);

                if (loja == null)
                    return NotFound(new { mensagem = "Loja nao encontrada para este usuario." });

                return Ok(loja);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpGet("destaques")]
        public async Task<IActionResult> ListarDestaques([FromQuery] int take = 10)
        {
            var lojas = await _lojaService.ListarDestaquesAsync(take);
            return Ok(lojas);
        }

        // Endpoint publico para consultar a loja pelo identificador.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObterPorId(int id, [FromQuery] bool registrarVisualizacao = false)
        {
            var loja = await _lojaService.ObterPorIdAsync(id, registrarVisualizacao);

            if (loja == null)
                return NotFound(new { mensagem = "Loja nao encontrada." });

            return Ok(loja);
        }
    }
}
