using System.Security.Cryptography;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Models.Dtos.Usuarios.Autenticacao;
using Omnimarket.Api.Services.Interfaces;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class PasswordResetService
    {
        private const string MensagemTokenInvalido = "Link de redefinicao invalido ou expirado.";

        private readonly DataContext _context;
        private readonly IEmailSender _emailSender;
        private readonly PasswordResetOptions _options;

        public PasswordResetService(
            DataContext context,
            IEmailSender emailSender,
            IOptions<PasswordResetOptions> options)
        {
            _context = context;
            _emailSender = emailSender;
            _options = options.Value;
        }

        public async Task SolicitarRedefinicaoAsync(
            string email,
            string frontendBaseUrl,
            CancellationToken cancellationToken = default)
        {
            var emailNormalizado = ValidadorEmail.Normalizar(email);
            if (string.IsNullOrWhiteSpace(emailNormalizado))
                return;

            var usuario = await _context.TBL_USUARIO
                .FirstOrDefaultAsync(u => u.Email == emailNormalizado, cancellationToken);

            if (usuario == null)
                return;

            var token = GerarNovaSolicitacao(usuario);

            await _context.SaveChangesAsync(cancellationToken);
            await EnviarEmailRedefinicaoAsync(usuario, frontendBaseUrl, token, cancellationToken);
        }

        public async Task ValidarTokenAsync(string token, CancellationToken cancellationToken = default)
        {
            _ = await ObterUsuarioPorTokenValidoAsync(token, cancellationToken);
        }

        public async Task RedefinirSenhaAsync(
            RedefinirSenhaDto dto,
            CancellationToken cancellationToken = default)
        {
            var usuario = await ObterUsuarioPorTokenValidoAsync(dto.Token, cancellationToken);

            Criptografia.CriarPasswordHash(dto.Password, out var hash, out var salt);

            usuario.PasswordHash = hash;
            usuario.PasswordSalt = salt;
            usuario.ResetSenhaTokenHash = null;
            usuario.ResetSenhaTokenExpiraEm = null;
            usuario.ResetSenhaSolicitadoEm = null;
            usuario.SessaoVersao++;

            await _context.SaveChangesAsync(cancellationToken);
        }

        public string GerarNovaSolicitacao(Usuario usuario)
        {
            var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
            var expiracaoHoras = _options.TokenExpiraEmHoras > 0 ? _options.TokenExpiraEmHoras : 2;

            usuario.ResetSenhaTokenHash = TokenSegurancaHelper.GerarHashSha256(token);
            usuario.ResetSenhaTokenExpiraEm = DateTime.UtcNow.AddHours(expiracaoHoras);
            usuario.ResetSenhaSolicitadoEm = DateTime.UtcNow;

            return token;
        }

        public async Task EnviarEmailRedefinicaoAsync(
            Usuario usuario,
            string frontendBaseUrl,
            string token,
            CancellationToken cancellationToken = default)
        {
            var linkRedefinicao = MontarLinkRedefinicao(frontendBaseUrl, token);
            var nomeAplicacao = string.IsNullOrWhiteSpace(_options.NomeAplicacao)
                ? "OmniMarket"
                : _options.NomeAplicacao.Trim();
            var nomeCompleto = $"{usuario.Nome} {usuario.Sobrenome}".Trim();

            var assunto = $"Redefina sua senha no {nomeAplicacao}";
            var corpoTexto =
                $"Ola, {nomeCompleto}.{Environment.NewLine}{Environment.NewLine}" +
                $"Recebemos um pedido para redefinir a senha da sua conta no {nomeAplicacao}.{Environment.NewLine}" +
                $"Use o link abaixo para continuar:{Environment.NewLine}" +
                $"{linkRedefinicao}{Environment.NewLine}{Environment.NewLine}" +
                "Se voce nao solicitou a redefinicao, ignore esta mensagem.";

            var corpoHtml =
                $"<p>Ola, {System.Net.WebUtility.HtmlEncode(nomeCompleto)}.</p>" +
                $"<p>Recebemos um pedido para redefinir a senha da sua conta no <strong>{System.Net.WebUtility.HtmlEncode(nomeAplicacao)}</strong>.</p>" +
                $"<p><a href=\"{System.Net.WebUtility.HtmlEncode(linkRedefinicao)}\">Clique aqui para redefinir sua senha</a></p>" +
                "<p>Se voce nao solicitou a redefinicao, ignore esta mensagem.</p>";

            await _emailSender.EnviarAsync(usuario.Email, assunto, corpoHtml, corpoTexto, cancellationToken);
        }

        private async Task<Usuario> ObterUsuarioPorTokenValidoAsync(
            string token,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException(MensagemTokenInvalido);

            var tokenHash = TokenSegurancaHelper.GerarHashSha256(token);
            var usuario = await _context.TBL_USUARIO
                .FirstOrDefaultAsync(u => u.ResetSenhaTokenHash == tokenHash, cancellationToken);

            if (usuario == null ||
                usuario.ResetSenhaTokenExpiraEm == null ||
                usuario.ResetSenhaTokenExpiraEm < DateTime.UtcNow)
            {
                throw new InvalidOperationException(MensagemTokenInvalido);
            }

            return usuario;
        }

        private string MontarLinkRedefinicao(string frontendBaseUrl, string token)
        {
            var baseUrl = string.IsNullOrWhiteSpace(_options.FrontendBaseUrl)
                ? frontendBaseUrl.TrimEnd('/')
                : _options.FrontendBaseUrl.TrimEnd('/');

            return $"{baseUrl}/recuperarSenha?token={Uri.EscapeDataString(token)}";
        }
    }
}
