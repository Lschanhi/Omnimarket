using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Route("api/uploads")]
    public class UploadsController : ControllerBase
    {
        private readonly ArquivoUploadService _arquivoUploadService;

        public UploadsController(ArquivoUploadService arquivoUploadService)
        {
            _arquivoUploadService = arquivoUploadService;
        }

        [Authorize]
        [HttpPost("usuarios/me/foto-perfil")]
        public async Task<IActionResult> UploadMinhaFotoPerfil([FromForm] IFormFile arquivo)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var upload = await _arquivoUploadService.UploadFotoPerfilUsuarioAsync(usuarioId, arquivo);
                return Ok(upload);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("lojas/minha/foto-perfil")]
        public async Task<IActionResult> UploadFotoPerfilMinhaLoja([FromForm] IFormFile arquivo)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var upload = await _arquivoUploadService.UploadFotoPerfilLojaAsync(usuarioId, arquivo);
                return Ok(upload);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("produtos/midias")]
        public async Task<IActionResult> UploadMidiasProduto([FromForm] List<IFormFile> arquivos)
        {
            try
            {
                var usuarioId = User.GetUserId();
                var uploads = await _arquivoUploadService.UploadMidiasProdutoAsync(usuarioId, arquivos);
                return Ok(uploads);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }
    }
}
