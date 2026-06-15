using Omnimarket.Api.Services.Interfaces;

namespace Omnimarket.Api.Tests.Support;

internal sealed class FakeEmailSender : IEmailSender
{
    public List<EmailEnviadoFake> MensagensEnviadas { get; } = [];

    public Task EnviarAsync(
        string paraEmail,
        string assunto,
        string corpoHtml,
        string corpoTexto,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        MensagensEnviadas.Add(new EmailEnviadoFake(paraEmail, assunto, corpoHtml, corpoTexto));
        return Task.CompletedTask;
    }
}

internal sealed record EmailEnviadoFake(
    string ParaEmail,
    string Assunto,
    string CorpoHtml,
    string CorpoTexto);
