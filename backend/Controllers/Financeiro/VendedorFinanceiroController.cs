using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/vendedor/financeiro")]
    public class VendedorFinanceiroController : ControllerBase
    {
        private readonly VendedorFinanceiroService _vendedorFinanceiroService;

        public VendedorFinanceiroController(
            VendedorFinanceiroService vendedorFinanceiroService)
        {
            _vendedorFinanceiroService = vendedorFinanceiroService;
        }

        [HttpGet("resumo")]
        public async Task<IActionResult> ObterResumo()
        {
            var usuarioId = User.GetUserId();
            var resumo = await _vendedorFinanceiroService.ObterResumoAsync(usuarioId);
            return Ok(resumo);
        }
    }
}
