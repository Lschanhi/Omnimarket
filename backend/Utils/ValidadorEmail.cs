using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net.Mail;

namespace Omnimarket.Api.Utils
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public sealed class EmailCadastroAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not string email || string.IsNullOrWhiteSpace(email))
                return ValidationResult.Success;

            return ValidadorEmail.TryValidarParaCadastro(email, out var mensagem)
                ? ValidationResult.Success
                : new ValidationResult(mensagem);
        }
    }

    public static class ValidadorEmail
    {
        public const string MensagemEmailInvalido = "Email invalido.";
        public const string MensagemEmailNaoPermitido =
            "Informe um email pessoal ou corporativo valido. Dominios de teste ou temporarios nao sao aceitos.";

        private static readonly HashSet<string> RotulosBloqueados = new(StringComparer.OrdinalIgnoreCase)
        {
            "example",
            "invalid",
            "localdomain",
            "localhost",
            "test"
        };

        private static readonly HashSet<string> DominiosTemporariosBloqueados = new(StringComparer.OrdinalIgnoreCase)
        {
            "10minutemail.com",
            "discard.email",
            "fakeinbox.com",
            "getnada.com",
            "guerrillamail.com",
            "mailinator.com",
            "sharklasers.com",
            "temp-mail.org",
            "tempmail.com",
            "trashmail.com",
            "yopmail.com"
        };

        public static string Normalizar(string? email)
        {
            return (email ?? string.Empty).Trim().ToLowerInvariant();
        }

        public static void GarantirValidoParaCadastro(string? email)
        {
            if (!TryValidarParaCadastro(email, out var mensagem))
                throw new InvalidOperationException(mensagem);
        }

        public static bool TryValidarParaCadastro(string? email, out string mensagem)
        {
            var emailNormalizado = Normalizar(email);

            if (string.IsNullOrWhiteSpace(emailNormalizado))
            {
                mensagem = MensagemEmailInvalido;
                return false;
            }

            if (!MailAddress.TryCreate(emailNormalizado, out var mailAddress) ||
                !string.Equals(mailAddress.Address, emailNormalizado, StringComparison.OrdinalIgnoreCase))
            {
                mensagem = MensagemEmailInvalido;
                return false;
            }

            var dominioAscii = ObterDominioAscii(mailAddress.Host);
            if (!DominioPossuiEstruturaValida(dominioAscii))
            {
                mensagem = MensagemEmailInvalido;
                return false;
            }

            if (DominioEstaBloqueado(dominioAscii))
            {
                mensagem = MensagemEmailNaoPermitido;
                return false;
            }

            mensagem = string.Empty;
            return true;
        }

        private static string ObterDominioAscii(string dominio)
        {
            try
            {
                return new IdnMapping().GetAscii(dominio.Trim()).ToLowerInvariant();
            }
            catch (ArgumentException)
            {
                return string.Empty;
            }
        }

        private static bool DominioPossuiEstruturaValida(string dominio)
        {
            if (string.IsNullOrWhiteSpace(dominio) || !dominio.Contains('.'))
                return false;

            var rotulos = dominio.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (rotulos.Length < 2)
                return false;

            if (rotulos.Any(rotulo =>
                    rotulo.Length is < 1 or > 63 ||
                    rotulo.StartsWith('-') ||
                    rotulo.EndsWith('-') ||
                    rotulo.Any(caractere => !char.IsLetterOrDigit(caractere) && caractere != '-')))
            {
                return false;
            }

            var tld = rotulos[^1];
            return tld.Length >= 2 && tld.All(char.IsLetter);
        }

        private static bool DominioEstaBloqueado(string dominio)
        {
            var rotulos = dominio.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (rotulos.Any(rotulo => RotulosBloqueados.Contains(rotulo)))
                return true;

            return DominiosTemporariosBloqueados.Any(dominioBloqueado =>
                string.Equals(dominio, dominioBloqueado, StringComparison.OrdinalIgnoreCase) ||
                dominio.EndsWith($".{dominioBloqueado}", StringComparison.OrdinalIgnoreCase));
        }
    }
}
