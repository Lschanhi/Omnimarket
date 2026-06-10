using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Models.Dtos.Financeiro;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = RolesSistema.Admin)]
    [Route("api/configuracao-marketplace")]
    public class ConfiguracaoMarketplaceController : ControllerBase
    {
        private readonly ComissaoMarketplaceService _comissaoMarketplaceService;

        public ConfiguracaoMarketplaceController(
            ComissaoMarketplaceService comissaoMarketplaceService)
        {
            _comissaoMarketplaceService = comissaoMarketplaceService;
        }

        [HttpGet("ativa")]
        public async Task<IActionResult> ObterConfiguracaoAtiva()
        {
            var configuracao = await _comissaoMarketplaceService.ObterConfiguracaoAtivaAsync();
            return Ok(configuracao);
        }

        [HttpPost]
        public async Task<IActionResult> CriarConfiguracao(
            [FromBody] ConfiguracaoMarketplaceCriacaoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var configuracao = await _comissaoMarketplaceService.CriarConfiguracaoAsync(dto);

            return Ok(new
            {
                mensagem = "Configuracao do marketplace salva com sucesso.",
                configuracao
            });
        }
    }
}
