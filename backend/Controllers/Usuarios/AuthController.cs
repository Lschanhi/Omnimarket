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
        private readonly EmailConfirmationService _emailConfirmationService;

        public AuthController(
            AuthService authService,
            EmailConfirmationService emailConfirmationService)
        {
            _authService = authService;
            _emailConfirmationService = emailConfirmationService;
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
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    mensagem = ex.Message
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

        [HttpGet("confirmar-email")]
        public async Task<IActionResult> ConfirmarEmail([FromQuery] string token, CancellationToken cancellationToken)
        {
            try
            {
                await _emailConfirmationService.ConfirmarEmailAsync(token, cancellationToken);

                return Ok(new
                {
                    mensagem = "Email confirmado com sucesso. Voce ja pode entrar na plataforma."
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    mensagem = ex.Message
                });
            }
        }

        [HttpPost("reenviar-confirmacao-email")]
        public async Task<IActionResult> ReenviarConfirmacaoEmail(
            [FromBody] ReenviarConfirmacaoEmailDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var apiBaseUrl = $"{Request.Scheme}://{Request.Host.ToUriComponent()}";
            await _emailConfirmationService.ReenviarConfirmacaoAsync(dto.Email, apiBaseUrl, cancellationToken);

            return Ok(new
            {
                mensagem =
                    "Se existir uma conta pendente para esse email, um novo link de confirmacao foi enviado."
            });
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
