using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Services.Interfaces;

namespace Omnimarket.Api.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpEmailOptions _options;

        public SmtpEmailSender(IOptions<SmtpEmailOptions> options)
        {
            _options = options.Value;
        }

        public async Task EnviarAsync(
            string paraEmail,
            string assunto,
            string corpoHtml,
            string corpoTexto,
            CancellationToken cancellationToken = default)
        {
            if (!_options.Enabled ||
                string.IsNullOrWhiteSpace(_options.Host) ||
                string.IsNullOrWhiteSpace(_options.FromEmail))
            {
                throw new InvalidOperationException(
                    "Configure o envio SMTP para habilitar a confirmacao obrigatoria de e-mail.");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName),
                Subject = assunto,
                Body = corpoTexto,
                IsBodyHtml = false
            };

            message.To.Add(new MailAddress(paraEmail));
            message.AlternateViews.Add(
                AlternateView.CreateAlternateViewFromString(corpoTexto, null, "text/plain"));
            message.AlternateViews.Add(
                AlternateView.CreateAlternateViewFromString(corpoHtml, null, "text/html"));

            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            if (!string.IsNullOrWhiteSpace(_options.Username))
            {
                client.Credentials = new NetworkCredential(_options.Username, _options.Password);
            }
            else
            {
                client.UseDefaultCredentials = true;
            }

            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message);
        }
    }
}
