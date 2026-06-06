using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omnimarket.Api.Models.Dtos.Usuarios.Autenticacao;
using Omnimarket.Api.Services;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto login)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _authService.Login(login);

                if (result == null)
                {
                    return Unauthorized(new
                    {
                        mensagem = "Email ou senha incorretos"
                    });
                }

                return Ok(new
                {
                    mensagem = "Login realizado com sucesso",
                    token = result.Token,
                    tokenExpiraEm = result.TokenExpiraEm,
                    usuario = new
                    {
                        nome = result.Nome,
                        email = result.Email,
                        role = result.Role
                    }
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensagem = "Erro interno ao realizar login"
                });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var usuarioId = User.GetUserId();
                await _authService.LogoutAsync(usuarioId);

                return Ok(new
                {
                    mensagem = "Logout realizado com sucesso"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    mensagem = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensagem = "Erro interno ao realizar logout"
                });
            }
        }
    }
}
