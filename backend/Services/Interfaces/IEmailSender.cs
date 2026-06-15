namespace Omnimarket.Api.Services.Interfaces
{
    public interface IEmailSender
    {
        Task EnviarAsync(
            string paraEmail,
            string assunto,
            string corpoHtml,
            string corpoTexto,
            CancellationToken cancellationToken = default);
    }
}
