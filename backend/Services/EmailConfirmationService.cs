using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Services.Interfaces;

namespace Omnimarket.Api.Services
{
    public class EmailConfirmationService
    {
        private const string MensagemTokenInvalido = "Link de confirmacao invalido ou expirado.";

        private readonly DataContext _context;
        private readonly IEmailSender _emailSender;
        private readonly EmailConfirmationOptions _options;

        public EmailConfirmationService(
            DataContext context,
            IEmailSender emailSender,
            IOptions<EmailConfirmationOptions> options)
        {
            _context = context;
            _emailSender = emailSender;
            _options = options.Value;
        }

        public string GerarNovaConfirmacao(Usuario usuario)
        {
            var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
            var expiracaoHoras = _options.TokenExpiraEmHoras > 0 ? _options.TokenExpiraEmHoras : 24;

            usuario.EmailConfirmado = false;
            usuario.DataConfirmacaoEmail = null;
            usuario.EmailConfirmacaoTokenHash = CalcularHashToken(token);
            usuario.EmailConfirmacaoTokenExpiraEm = DateTime.UtcNow.AddHours(expiracaoHoras);
            usuario.EmailConfirmacaoEnviadoEm = DateTime.UtcNow;

            return token;
        }

        public async Task EnviarEmailConfirmacaoAsync(
            Usuario usuario,
            string apiBaseUrl,
            string token,
            CancellationToken cancellationToken = default)
        {
            var linkConfirmacao = MontarLinkConfirmacao(apiBaseUrl, token);
            var nomeAplicacao = string.IsNullOrWhiteSpace(_options.NomeAplicacao)
                ? "OmniMarket"
                : _options.NomeAplicacao.Trim();
            var nomeCompleto = $"{usuario.Nome} {usuario.Sobrenome}".Trim();

            var assunto = $"Confirme seu e-mail no {nomeAplicacao}";
            var corpoTexto =
                $"Ola, {nomeCompleto}.{Environment.NewLine}{Environment.NewLine}" +
                $"Confirme seu e-mail para ativar a sua conta no {nomeAplicacao}:{Environment.NewLine}" +
                $"{linkConfirmacao}{Environment.NewLine}{Environment.NewLine}" +
                "Se voce nao criou essa conta, ignore esta mensagem.";

            var corpoHtml =
                $"<p>Ola, {System.Net.WebUtility.HtmlEncode(nomeCompleto)}.</p>" +
                $"<p>Confirme seu e-mail para ativar a sua conta no <strong>{System.Net.WebUtility.HtmlEncode(nomeAplicacao)}</strong>.</p>" +
                $"<p><a href=\"{System.Net.WebUtility.HtmlEncode(linkConfirmacao)}\">Clique aqui para confirmar seu e-mail</a></p>" +
                "<p>Se voce nao criou essa conta, ignore esta mensagem.</p>";

            await _emailSender.EnviarAsync(usuario.Email, assunto, corpoHtml, corpoTexto, cancellationToken);
        }

        public async Task ConfirmarEmailAsync(string token, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException(MensagemTokenInvalido);

            var tokenHash = CalcularHashToken(token);
            var usuario = await _context.TBL_USUARIO
                .FirstOrDefaultAsync(
                    u => u.EmailConfirmacaoTokenHash == tokenHash,
                    cancellationToken);

            if (usuario == null ||
                usuario.EmailConfirmacaoTokenExpiraEm == null ||
                usuario.EmailConfirmacaoTokenExpiraEm < DateTime.UtcNow)
            {
                throw new InvalidOperationException(MensagemTokenInvalido);
            }

            usuario.EmailConfirmado = true;
            usuario.DataConfirmacaoEmail = DateTime.UtcNow;
            usuario.EmailConfirmacaoTokenHash = null;
            usuario.EmailConfirmacaoTokenExpiraEm = null;

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task ReenviarConfirmacaoAsync(
            string email,
            string apiBaseUrl,
            CancellationToken cancellationToken = default)
        {
            var emailNormalizado = (email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(emailNormalizado))
                return;

            var usuario = await _context.TBL_USUARIO
                .FirstOrDefaultAsync(u => u.Email == emailNormalizado, cancellationToken);

            if (usuario == null || usuario.EmailConfirmado)
                return;

            var token = GerarNovaConfirmacao(usuario);
            await _context.SaveChangesAsync(cancellationToken);
            await EnviarEmailConfirmacaoAsync(usuario, apiBaseUrl, token, cancellationToken);
        }

        private static string CalcularHashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }

        private string MontarLinkConfirmacao(string apiBaseUrl, string token)
        {
            var frontendBaseUrl = (_options.FrontendBaseUrl ?? string.Empty).Trim();
            var baseUrl = string.IsNullOrWhiteSpace(frontendBaseUrl)
                ? apiBaseUrl.TrimEnd('/')
                : frontendBaseUrl.TrimEnd('/');
            var path = string.IsNullOrWhiteSpace(frontendBaseUrl)
                ? "/api/auth/confirmar-email"
                : "/confirmar-email";

            return $"{baseUrl}{path}?token={Uri.EscapeDataString(token)}";
        }
    }
}
