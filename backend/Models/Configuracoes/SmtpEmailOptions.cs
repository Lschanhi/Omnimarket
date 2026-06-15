namespace Omnimarket.Api.Models.Configuracoes
{
    public class SmtpEmailOptions
    {
        public const string SectionName = "SmtpEmail";

        public bool Enabled { get; set; }
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public bool EnableSsl { get; set; } = true;
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = "OmniMarket";
    }
}
