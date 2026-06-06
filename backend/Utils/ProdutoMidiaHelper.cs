using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Utils
{
    public static class ProdutoMidiaHelper
    {
        public const int QuantidadeMaximaMidiasPorOperacao = 5;
        public const long TamanhoMaximoMidiaEmBytes = 15 * 1024 * 1024;

        private static readonly Dictionary<string, TipoMidiaProduto> ExtensoesSuportadas = new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = TipoMidiaProduto.Foto,
            [".jpeg"] = TipoMidiaProduto.Foto,
            [".png"] = TipoMidiaProduto.Foto,
            [".webp"] = TipoMidiaProduto.Foto,
            [".gif"] = TipoMidiaProduto.Foto,
            [".mp4"] = TipoMidiaProduto.Video,
            [".webm"] = TipoMidiaProduto.Video,
            [".ogg"] = TipoMidiaProduto.Video,
            [".mov"] = TipoMidiaProduto.Video
        };

        public static bool EhDataUrl(string? valor)
        {
            return !string.IsNullOrWhiteSpace(valor) &&
                valor.StartsWith("data:", StringComparison.OrdinalIgnoreCase);
        }

        public static bool EhUrlHttpOuHttpsAbsoluta(string? valor)
        {
            if (!Uri.TryCreate(valor, UriKind.Absolute, out var uri))
                return false;

            return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
        }

        public static string ObterUrlLeitura(ProdutoMidia midia)
        {
            return string.IsNullOrWhiteSpace(midia.Url) ? string.Empty : midia.Url;
        }

        public static string MontarDataUrl(string mimeType, byte[] conteudo)
        {
            return $"data:{mimeType};base64,{Convert.ToBase64String(conteudo)}";
        }

        public static (string MimeType, byte[] Conteudo) ConverterDataUrl(string dataUrl, string mensagemErro)
        {
            if (string.IsNullOrWhiteSpace(dataUrl))
                throw new InvalidOperationException(mensagemErro);

            const string marker = ";base64,";
            var base64SeparatorIndex = dataUrl.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

            if (!dataUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase) ||
                base64SeparatorIndex <= "data:".Length)
            {
                throw new InvalidOperationException(mensagemErro);
            }

            var mimeType = dataUrl["data:".Length..base64SeparatorIndex].Trim();
            var base64 = dataUrl[(base64SeparatorIndex + marker.Length)..].Trim();

            try
            {
                return (mimeType, Convert.FromBase64String(base64));
            }
            catch (FormatException)
            {
                throw new InvalidOperationException(mensagemErro);
            }
        }

        public static TipoMidiaProduto DeterminarTipoMidia(string? contentType, string? nomeArquivo, string mensagemErro)
        {
            var mimeType = contentType?.Trim();

            if (!string.IsNullOrWhiteSpace(mimeType))
            {
                if (mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    return TipoMidiaProduto.Foto;

                if (mimeType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
                    return TipoMidiaProduto.Video;
            }

            var extensao = Path.GetExtension(nomeArquivo ?? string.Empty);
            if (!string.IsNullOrWhiteSpace(extensao) && ExtensoesSuportadas.TryGetValue(extensao, out var tipo))
                return tipo;

            throw new InvalidOperationException(mensagemErro);
        }

        public static string SanitizarNomeArquivo(string? nomeArquivo, TipoMidiaProduto tipo)
        {
            var nomeFinal = Path.GetFileName(nomeArquivo?.Trim());
            if (!string.IsNullOrWhiteSpace(nomeFinal))
                return nomeFinal;

            return tipo == TipoMidiaProduto.Video ? "midia-produto.mp4" : "midia-produto.png";
        }
    }
}
