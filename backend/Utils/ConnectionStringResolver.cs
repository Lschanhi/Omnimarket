using Microsoft.Extensions.Configuration;

namespace Omnimarket.Api.Utils
{
    public static class ConnectionStringResolver
    {
        private static readonly string[] DevelopmentCandidates =
        [
            "ConexaoLocal",
            "ConexaoCasa",
            "ConexaoAzure",
            "ConexaoAzureBk"
        ];

        private static readonly string[] ProductionCandidates =
        [
            "ConexaoAzureBk",
            "ConexaoAzure",
            "ConexaoLocal",
            "ConexaoCasa"
        ];

        public static (string Name, string Value) Resolve(IConfiguration configuration, bool isDevelopment)
        {
            var configuredName = configuration["Database:ConnectionStringName"]?.Trim();
            if (!string.IsNullOrWhiteSpace(configuredName))
            {
                var configuredValue = configuration.GetConnectionString(configuredName);
                if (IsConfigured(configuredValue))
                    return (configuredName, configuredValue!);

                throw new InvalidOperationException(
                    $"A connection string '{configuredName}' configurada em Database:ConnectionStringName nao e valida.");
            }

            var defaultConnection = configuration.GetConnectionString("Default");
            if (IsConfigured(defaultConnection))
                return ("Default", defaultConnection!);

            var candidates = isDevelopment ? DevelopmentCandidates : ProductionCandidates;
            foreach (var candidate in candidates)
            {
                var candidateValue = configuration.GetConnectionString(candidate);
                if (IsConfigured(candidateValue))
                    return (candidate, candidateValue!);
            }

            var suggestedName = isDevelopment ? "ConexaoLocal" : "ConexaoAzureBk";
            throw new InvalidOperationException(
                $"Configure uma connection string valida em ConnectionStrings:{suggestedName}, ConnectionStrings:Default ou defina Database:ConnectionStringName.");
        }

        private static bool IsConfigured(string? connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                return false;

            return !connectionString.Contains("SEU_SERVIDOR", StringComparison.OrdinalIgnoreCase) &&
                   !connectionString.Contains("SUA_SENHA", StringComparison.OrdinalIgnoreCase) &&
                   !connectionString.Contains("DEFINA_", StringComparison.OrdinalIgnoreCase);
        }
    }
}
