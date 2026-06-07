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
            "ConexaoAzure",
            "ConexaoAzureBk"
        ];

        public static (string Name, string Value) Resolve(IConfiguration configuration, bool isDevelopment)
        {
            var configuredName = configuration["Database:ConnectionStringName"]?.Trim();
            foreach (var candidate in EnumerateCandidates(configuredName, isDevelopment))
            {
                var candidateValue = configuration.GetConnectionString(candidate);
                if (IsConfigured(candidateValue))
                    return (candidate, candidateValue!);
            }

            var suggestedName = isDevelopment ? "ConexaoLocal" : "ConexaoAzure";
            throw new InvalidOperationException(
                $"Configure uma connection string valida em ConnectionStrings:{suggestedName}, ConnectionStrings:Default ou defina Database:ConnectionStringName.");
        }

        private static IEnumerable<string> EnumerateCandidates(string? configuredName, bool isDevelopment)
        {
            var yielded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(configuredName) && yielded.Add(configuredName))
                yield return configuredName;

            var candidates = isDevelopment ? DevelopmentCandidates : ProductionCandidates;
            foreach (var candidate in candidates)
            {
                if (yielded.Add(candidate))
                    yield return candidate;
            }

            if (yielded.Add("Default"))
                yield return "Default";
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
