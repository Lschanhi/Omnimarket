namespace Omnimarket.Api.Models.Configuracoes
{
    public class EmailConfirmationOptions
    {
        public const string SectionName = "EmailConfirmation";

        public int TokenExpiraEmHoras { get; set; } = 24;
        public string NomeAplicacao { get; set; } = "OmniMarket";
        public string FrontendBaseUrl { get; set; } = string.Empty;
    }
}
