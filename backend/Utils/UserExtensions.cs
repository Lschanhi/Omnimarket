using System.Security.Claims;
using Omnimarket.Api.Services;

namespace Omnimarket.Api.Utils
{
    public static class UserExtensions
    {
        // Centraliza a leitura do id do usuario autenticado a partir das claims do token.
        public static int GetUserId(this ClaimsPrincipal user)
        {
            // Primeiro tenta o nome padrao do ASP.NET; o fallback "id" cobre tokens antigos.
            var claim = user.FindFirst(ClaimTypes.NameIdentifier)
                ?? user.FindFirst("id");

            if (claim == null)
                throw new UnauthorizedAccessException("Usuario nao autenticado.");

            return int.Parse(claim.Value);
        }

        public static int GetSessionVersion(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst(TokenService.SessionVersionClaim);

            if (claim == null || !int.TryParse(claim.Value, out var sessaoVersao))
                throw new UnauthorizedAccessException("Token de sessao invalido.");

            return sessaoVersao;
        }
    }
}
