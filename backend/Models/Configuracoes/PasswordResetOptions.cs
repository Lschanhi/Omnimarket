namespace Omnimarket.Api.Models.Configuracoes
{
    public class PasswordResetOptions
    {
        public const string SectionName = "PasswordReset";

        public int TokenExpiraEmHoras { get; set; } = 2;
        public string NomeAplicacao { get; set; } = "OmniMarket";
        public string FrontendBaseUrl { get; set; } = string.Empty;
    }
}
