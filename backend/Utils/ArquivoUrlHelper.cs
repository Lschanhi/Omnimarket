namespace Omnimarket.Api.Utils
{
    public static class ArquivoUrlHelper
    {
        public static string? ExtrairNomeArquivo(string? urlArquivo)
        {
            if (!Uri.TryCreate(urlArquivo, UriKind.Absolute, out var arquivoUri))
                return null;

            var nomeArquivo = Path.GetFileName(Uri.UnescapeDataString(arquivoUri.AbsolutePath));
            if (string.IsNullOrWhiteSpace(nomeArquivo))
                return null;

            return TemPrefixoGuid(nomeArquivo) ? nomeArquivo[33..] : nomeArquivo;
        }

        private static bool TemPrefixoGuid(string nomeArquivo)
        {
            if (nomeArquivo.Length <= 33 || nomeArquivo[32] != '-')
                return false;

            for (var i = 0; i < 32; i++)
            {
                if (!Uri.IsHexDigit(nomeArquivo[i]))
                    return false;
            }

            return true;
        }
    }
}
