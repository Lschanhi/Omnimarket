using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Models.Dtos.Usuarios;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly UsuarioPerfilService _usuarioPerfilService;

        public UsuarioController(AuthService authService, UsuarioPerfilService usuarioPerfilService)
        {
            _authService = authService;
            _usuarioPerfilService = usuarioPerfilService;
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.GetUserId();
            var usuario = await _usuarioPerfilService.ObterPerfilAsync(userId);

            if (usuario is null)
                return NotFound();

            return Ok(usuario);
        }

        [Authorize]
        [HttpGet("me/foto-perfil")]
        public async Task<IActionResult> GetMinhaFotoPerfil()
        {
            var userId = User.GetUserId();
            var fotoPerfil = await _usuarioPerfilService.ObterFotoPerfilAsync(userId);

            return fotoPerfil is null
                ? NotFound(new { mensagem = "Foto de perfil nao encontrada." })
                : Ok(fotoPerfil);
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> RegistrarUsuario([FromBody] UsuarioRegistroComContatoDto userDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var usuario = await _authService.RegistrarUsuario(userDto);

                return Ok(new
                {
                    mensagem = "Usuario registrado com sucesso!",
                    usuario = new
                    {
                        id = usuario.Id,
                        nome = $"{usuario.Nome} {usuario.Sobrenome}",
                        email = usuario.Email
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> AtualizarUsuario(int id, [FromBody] UsuarioAtualizarDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var usuarioIdLogado = User.GetUserId();
            if (id != usuarioIdLogado)
                return Forbid();

            try
            {
                var usuario = await _usuarioPerfilService.AtualizarAsync(id, dto);
                if (usuario == null)
                    return NotFound(new { mensagem = "Usuario nao encontrado." });

                return Ok(new
                {
                    mensagem = "Usuario atualizado com sucesso!",
                    usuario = new
                    {
                        usuario.Id,
                        usuario.Nome,
                        usuario.Sobrenome,
                        usuario.Email
                    }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("me/foto-perfil")]
        public async Task<IActionResult> AtualizarMinhaFotoPerfil(
            [FromBody] UsuarioFotoPerfilAtualizarDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var usuarioId = User.GetUserId();
                var fotoPerfil = await _usuarioPerfilService.AtualizarFotoPerfilAsync(usuarioId, dto);

                return Ok(new
                {
                    mensagem = "Foto de perfil atualizada com sucesso!",
                    fotoPerfil
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("me/foto-perfil")]
        public async Task<IActionResult> RemoverMinhaFotoPerfil()
        {
            var usuarioId = User.GetUserId();
            var removida = await _usuarioPerfilService.RemoverFotoPerfilAsync(usuarioId);

            return removida
                ? Ok(new { mensagem = "Foto de perfil removida com sucesso." })
                : NotFound(new { mensagem = "Foto de perfil nao encontrada." });
        }
    }
}
