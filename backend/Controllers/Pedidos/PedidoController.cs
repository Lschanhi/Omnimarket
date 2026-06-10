using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Models.Dtos.Pedidos;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/pedidos")]
    public class PedidoController : ControllerBase
    {
        private readonly PedidoService _pedidoService;
        private readonly ReciboPedidoService _reciboPedidoService;
        private readonly SolicitacaoCancelamentoService _solicitacaoCancelamentoService;

        public PedidoController(
            PedidoService pedidoService,
            ReciboPedidoService reciboPedidoService,
            SolicitacaoCancelamentoService solicitacaoCancelamentoService)
        {
            _pedidoService = pedidoService;
            _reciboPedidoService = reciboPedidoService;
            _solicitacaoCancelamentoService = solicitacaoCancelamentoService;
        }

        // Cria um pedido para o usuario autenticado a partir dos itens enviados no body
        // ou, se o body vier sem itens, usa os produtos atuais do carrinho.
        [HttpPost]
        public async Task<IActionResult> CriarPedido([FromBody] PedidoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var usuarioId = User.GetUserId();
                var pedido = await _pedidoService.CriarPedido(usuarioId, dto);

                return Ok(new
                {
                    mensagem = "Pedido criado com sucesso!",
                    pedidoId = pedido.Id,
                    valorProdutos = pedido.ValorTotalProdutos,
                    valorFrete = pedido.ValorFrete,
                    valorTotal = pedido.ValorTotalPedido,
                    valorComissao = pedido.ValorComissao,
                    valorLiquidoVendedor = pedido.ValorLiquidoVendedor,
                    taxaFixaComissao = pedido.TaxaFixaComissao,
                    percentualComissao = pedido.PercentualComissao,
                    status = pedido.StatusPedidosId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        // Busca um pedido especifico, mas somente se ele pertencer ao usuario logado.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> BuscarPedido(int id)
        {
            var usuarioId = User.GetUserId();
            var pedido = await _pedidoService.BuscarPedido(id, usuarioId);

            if (pedido == null)
                return NotFound(new { mensagem = "Pedido nao encontrado." });

            return Ok(pedido);
        }

        // Lista os pedidos do proprio usuario e bloqueia a consulta de terceiros.
        [HttpGet("usuario/{usuarioId:int}")]
        public async Task<IActionResult> ListarPedidoUsuario(int usuarioId)
        {
            var usuarioIdLogado = User.GetUserId();

            if (usuarioId != usuarioIdLogado)
                return Forbid();

            var pedidos = await _pedidoService.ListarPedidosUsuario(usuarioIdLogado);

            return Ok(pedidos);
        }

        // Cancela um pedido do usuario logado respeitando as regras do servico.
        [HttpPut("{id:int}/cancelar")]
        public async Task<IActionResult> CancelarPedido(int id)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var cancelado = await _pedidoService.CancelarPedido(id, usuarioId);

                if (!cancelado)
                    return NotFound(new { mensagem = "Pedido nao encontrado." });

                return Ok(new { mensagem = "Pedido cancelado com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{id:int}/solicitacoes-cancelamento")]
        [HttpGet("{id:int}/solicitacoes")]
        public async Task<IActionResult> ListarSolicitacoesCancelamento(int id)
        {
            var usuarioId = User.GetUserId();
            var solicitacoes = await _solicitacaoCancelamentoService.ListarDoPedidoAsync(id, usuarioId);

            if (solicitacoes.Count == 0)
            {
                var pedido = await _pedidoService.BuscarPedido(id, usuarioId);
                if (pedido == null)
                    return NotFound(new { mensagem = "Pedido nao encontrado." });
            }

            return Ok(solicitacoes);
        }

        [HttpPost("{id:int}/solicitacoes-cancelamento")]
        [HttpPost("{id:int}/solicitacoes")]
        public async Task<IActionResult> CriarSolicitacaoCancelamento(
            int id,
            [FromBody] SolicitacaoCancelamentoCriacaoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var usuarioId = User.GetUserId();
                var solicitacao = await _solicitacaoCancelamentoService.CriarAsync(id, usuarioId, dto);

                if (solicitacao == null)
                    return NotFound(new { mensagem = "Pedido nao encontrado." });

                return Ok(new
                {
                    mensagem = "Solicitacao do pedido criada com sucesso!",
                    solicitacao
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPut("solicitacoes-cancelamento/{solicitacaoId:int}/cancelar")]
        [HttpPut("solicitacoes/{solicitacaoId:int}/cancelar")]
        public async Task<IActionResult> CancelarSolicitacaoCancelamento(int solicitacaoId)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var solicitacao = await _solicitacaoCancelamentoService.CancelarPeloCompradorAsync(
                    solicitacaoId,
                    usuarioId);

                if (solicitacao == null)
                    return NotFound(new { mensagem = "Solicitacao do pedido nao encontrada." });

                return Ok(new
                {
                    mensagem = "Solicitacao do pedido cancelada com sucesso!",
                    solicitacao
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        // Depois que o pedido foi enviado, o proprio cliente confirma o recebimento.
        [HttpPut("{id:int}/confirmar-entrega")]
        public async Task<IActionResult> ConfirmarEntrega(int id)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var pedido = await _pedidoService.ConfirmarEntregaPedidoAsync(id, usuarioId);

                if (pedido == null)
                    return NotFound(new { mensagem = "Pedido nao encontrado." });

                return Ok(new
                {
                    mensagem = "Pedido marcado como entregue com sucesso!",
                    pedidoId = pedido.Id,
                    status = pedido.StatusPedidosId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{id:int}/recibo")]
        public async Task<IActionResult> BaixarRecibo(int id)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var pdf = await _reciboPedidoService.GerarReciboPedidoAsync(id, usuarioId);

                if (pdf == null)
                    return NotFound(new { mensagem = "Pedido nao encontrado." });

                return File(
                    pdf,
                    "application/pdf",
                    $"recibo-pedido-{id}.pdf");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }
    }
}
