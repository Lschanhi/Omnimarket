using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Services.Interfaces;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class LegacyImageMigrationService
    {
        private static readonly string[] PrefixosUrlLocal =
        [
            "/uploads/",
            "/upload/",
            "/images/",
            "/image/",
            "/imagens/",
            "/midias/",
            "/media/",
            "/arquivos/"
        ];

        private readonly DataContext _context;
        private readonly IArquivoStorageService _arquivoStorageService;
        private readonly AzureBlobStorageOptions _blobStorageOptions;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<LegacyImageMigrationService> _logger;
        private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();
        private readonly Uri? _blobServiceUri;

        public LegacyImageMigrationService(
            DataContext context,
            IArquivoStorageService arquivoStorageService,
            IOptions<AzureBlobStorageOptions> blobStorageOptions,
            IWebHostEnvironment environment,
            ILogger<LegacyImageMigrationService> logger)
        {
            _context = context;
            _arquivoStorageService = arquivoStorageService;
            _blobStorageOptions = blobStorageOptions.Value;
            _environment = environment;
            _logger = logger;
            _blobServiceUri = TryCriarBlobServiceUri(_blobStorageOptions.ConnectionString);
        }

        public async Task<LegacyImageMigrationResult> MigrarAsync(CancellationToken cancellationToken = default)
        {
            var resultado = new LegacyImageMigrationResult();

            if (!BlobStorageConfigurado())
            {
                resultado.Ignorado = true;
                resultado.MotivoIgnorado = "Blob Storage nao configurado.";
                _logger.LogInformation("Migracao de imagens legadas ignorada: {Motivo}.", resultado.MotivoIgnorado);
                return resultado;
            }

            await MigrarFotosPerfilUsuarioAsync(resultado, cancellationToken);
            await MigrarMidiasProdutoAsync(resultado, cancellationToken);
            await MigrarFotosPerfilLojaAsync(resultado, cancellationToken);

            if (resultado.TotalMigrado > 0)
            {
                _logger.LogInformation(
                    "Migracao de imagens legadas concluida. Usuarios: {Usuarios}, midias de produto: {MidiasProduto}, lojas: {Lojas}.",
                    resultado.FotosPerfilUsuarioMigradas,
                    resultado.MidiasProdutoMigradas,
                    resultado.FotosPerfilLojaMigradas);
            }

            foreach (var pendencia in resultado.Pendencias)
                _logger.LogWarning("Pendencia na migracao de imagens legadas: {Pendencia}", pendencia);

            return resultado;
        }

        private async Task MigrarFotosPerfilUsuarioAsync(
            LegacyImageMigrationResult resultado,
            CancellationToken cancellationToken)
        {
            var registros = await _context.TBL_USUARIO_FOTO_PERFIL
                .ToListAsync(cancellationToken);

            foreach (var fotoPerfil in registros.Where(PrecisaMigrarFotoPerfilUsuario))
            {
                if (!TryObterArquivoLegado(
                        fotoPerfil.Url,
                        fotoPerfil.Conteudo,
                        fotoPerfil.MimeType,
                        fotoPerfil.NomeArquivo,
                        "foto-perfil-usuario",
                        out var arquivo,
                        out var motivoPendencia))
                {
                    resultado.AdicionarPendencia($"usuario:{fotoPerfil.UsuarioId}", fotoPerfil.Url, motivoPendencia);
                    continue;
                }

                await using var stream = new MemoryStream(arquivo.Conteudo, writable: false);
                fotoPerfil.Url = await _arquivoStorageService.SalvarAsync(
                    _blobStorageOptions.FotoPerfilContainerName,
                    $"usuarios/{fotoPerfil.UsuarioId}/perfil",
                    arquivo.NomeArquivo,
                    arquivo.ContentType,
                    stream,
                    cancellationToken);

                fotoPerfil.MimeType = arquivo.ContentType;
                fotoPerfil.NomeArquivo = arquivo.NomeArquivo;
                fotoPerfil.Conteudo = Array.Empty<byte>();
                fotoPerfil.DtAtualizacao = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
                resultado.FotosPerfilUsuarioMigradas++;
            }
        }

        private async Task MigrarMidiasProdutoAsync(
            LegacyImageMigrationResult resultado,
            CancellationToken cancellationToken)
        {
            var registros = await _context.ProdutoMidia
                .ToListAsync(cancellationToken);

            foreach (var midia in registros.Where(PrecisaMigrarMidiaProduto))
            {
                if (!TryObterArquivoLegado(
                        midia.Url,
                        midia.Conteudo,
                        midia.ContentType,
                        midia.NomeArquivo,
                        midia.Tipo == TipoMidiaProduto.Video ? "midia-produto-video" : "midia-produto-foto",
                        out var arquivo,
                        out var motivoPendencia))
                {
                    resultado.AdicionarPendencia($"produto-midia:{midia.Id}", midia.Url, motivoPendencia);
                    continue;
                }

                await using var stream = new MemoryStream(arquivo.Conteudo, writable: false);
                midia.Url = await _arquivoStorageService.SalvarAsync(
                    ObterContainerProduto(midia.Tipo),
                    $"produtos/{midia.ProdutoId}/midias",
                    arquivo.NomeArquivo,
                    arquivo.ContentType,
                    stream,
                    cancellationToken);

                midia.ContentType = arquivo.ContentType;
                midia.NomeArquivo = arquivo.NomeArquivo;
                midia.Conteudo = null;

                await _context.SaveChangesAsync(cancellationToken);
                resultado.MidiasProdutoMigradas++;
            }
        }

        private async Task MigrarFotosPerfilLojaAsync(
            LegacyImageMigrationResult resultado,
            CancellationToken cancellationToken)
        {
            var registros = await _context.TBL_LOJA
                .Where(loja => loja.FotoPerfilUrl != null && loja.FotoPerfilUrl != string.Empty)
                .ToListAsync(cancellationToken);

            foreach (var loja in registros.Where(PrecisaMigrarFotoPerfilLoja))
            {
                if (!TryObterArquivoLegado(
                        loja.FotoPerfilUrl,
                        null,
                        null,
                        null,
                        "foto-perfil-loja",
                        out var arquivo,
                        out var motivoPendencia))
                {
                    resultado.AdicionarPendencia($"loja:{loja.Id}", loja.FotoPerfilUrl, motivoPendencia);
                    continue;
                }

                await using var stream = new MemoryStream(arquivo.Conteudo, writable: false);
                loja.FotoPerfilUrl = await _arquivoStorageService.SalvarAsync(
                    _blobStorageOptions.FotoPerfilLojaContainerName,
                    $"lojas/usuarios/{loja.UsuarioId}/perfil",
                    arquivo.NomeArquivo,
                    arquivo.ContentType,
                    stream,
                    cancellationToken);

                loja.DtAtualizacao = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
                resultado.FotosPerfilLojaMigradas++;
            }
        }

        private bool PrecisaMigrarFotoPerfilUsuario(UsuarioFotoPerfil fotoPerfil)
        {
            if (fotoPerfil.Conteudo.Length > 0)
                return true;

            return UrlPrecisaMigracao(fotoPerfil.Url);
        }

        private bool PrecisaMigrarMidiaProduto(ProdutoMidia midia)
        {
            if (midia.Conteudo is { Length: > 0 })
                return true;

            return UrlPrecisaMigracao(midia.Url);
        }

        private bool PrecisaMigrarFotoPerfilLoja(Loja loja)
        {
            return UrlPrecisaMigracao(loja.FotoPerfilUrl);
        }

        private bool UrlPrecisaMigracao(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return false;

            if (ProdutoMidiaHelper.EhDataUrl(url))
                return true;

            if (EhUrlBlob(url))
                return false;

            return EhUrlLocalLegada(url);
        }

        private bool TryObterArquivoLegado(
            string? url,
            byte[]? conteudo,
            string? contentTypeDeclarado,
            string? nomeArquivoDeclarado,
            string nomeBaseFallback,
            out ArquivoLegado arquivo,
            out string motivoPendencia)
        {
            if (conteudo is { Length: > 0 })
            {
                var nomeArquivo = ResolverNomeArquivo(nomeArquivoDeclarado, url, contentTypeDeclarado, nomeBaseFallback);
                var contentType = ResolverContentType(contentTypeDeclarado, nomeArquivo);

                arquivo = new ArquivoLegado(nomeArquivo, contentType, conteudo);
                motivoPendencia = string.Empty;
                return true;
            }

            if (ProdutoMidiaHelper.EhDataUrl(url))
            {
                try
                {
                    var (mimeType, bytes) = ProdutoMidiaHelper.ConverterDataUrl(url!, "Formato de imagem legado invalido.");
                    var nomeArquivo = ResolverNomeArquivo(nomeArquivoDeclarado, url, mimeType, nomeBaseFallback);
                    arquivo = new ArquivoLegado(nomeArquivo, mimeType, bytes);
                    motivoPendencia = string.Empty;
                    return true;
                }
                catch (InvalidOperationException ex)
                {
                    arquivo = default;
                    motivoPendencia = ex.Message;
                    return false;
                }
            }

            if (TryResolverArquivoLocal(url, out var caminhoArquivo))
            {
                var nomeArquivo = ResolverNomeArquivo(
                    nomeArquivoDeclarado,
                    Path.GetFileName(caminhoArquivo),
                    contentTypeDeclarado,
                    nomeBaseFallback);
                var contentType = ResolverContentType(contentTypeDeclarado, nomeArquivo);
                arquivo = new ArquivoLegado(nomeArquivo, contentType, File.ReadAllBytes(caminhoArquivo));
                motivoPendencia = string.Empty;
                return true;
            }

            arquivo = default;
            motivoPendencia = string.IsNullOrWhiteSpace(url)
                ? "Registro sem URL e sem conteudo binario."
                : $"Arquivo legado nao encontrado para '{url}'.";
            return false;
        }

        private bool TryResolverArquivoLocal(string? url, out string caminhoArquivo)
        {
            caminhoArquivo = string.Empty;

            if (string.IsNullOrWhiteSpace(url) || !EhUrlLocalLegada(url))
                return false;

            var candidatos = new List<string>();

            if (Uri.TryCreate(url, UriKind.Absolute, out var absoluteUri))
            {
                if (absoluteUri.IsFile)
                {
                    candidatos.Add(absoluteUri.LocalPath);
                }
                else
                {
                    AdicionarCandidatosRelativos(candidatos, Uri.UnescapeDataString(absoluteUri.AbsolutePath));
                }
            }
            else
            {
                AdicionarCandidatosRelativos(candidatos, url);
            }

            foreach (var candidato in candidatos)
            {
                var caminhoNormalizado = NormalizarCaminhoSeguro(candidato);
                if (string.IsNullOrWhiteSpace(caminhoNormalizado))
                    continue;

                if (!File.Exists(caminhoNormalizado))
                    continue;

                caminhoArquivo = caminhoNormalizado;
                return true;
            }

            return false;
        }

        private void AdicionarCandidatosRelativos(List<string> candidatos, string caminhoOrigem)
        {
            var caminhoSemQuery = caminhoOrigem
                .Split('?', '#')[0]
                .Replace('/', Path.DirectorySeparatorChar)
                .Replace('\\', Path.DirectorySeparatorChar)
                .Trim();

            if (string.IsNullOrWhiteSpace(caminhoSemQuery))
                return;

            caminhoSemQuery = caminhoSemQuery.TrimStart('~');

            if (Path.IsPathRooted(caminhoSemQuery))
            {
                candidatos.Add(caminhoSemQuery);
                return;
            }

            var caminhoRelativo = caminhoSemQuery.TrimStart(Path.DirectorySeparatorChar);
            var webRootPath = _environment.WebRootPath;

            if (!string.IsNullOrWhiteSpace(webRootPath))
                candidatos.Add(Path.Combine(webRootPath, caminhoRelativo));

            candidatos.Add(Path.Combine(_environment.ContentRootPath, caminhoRelativo));

            if (caminhoRelativo.StartsWith(
                    $"wwwroot{Path.DirectorySeparatorChar}",
                    StringComparison.OrdinalIgnoreCase))
            {
                candidatos.Add(Path.Combine(_environment.ContentRootPath, caminhoRelativo));
            }
        }

        private string NormalizarCaminhoSeguro(string caminho)
        {
            try
            {
                var caminhoCompleto = Path.GetFullPath(caminho);
                var contentRoot = Path.GetFullPath(_environment.ContentRootPath);

                if (caminhoCompleto.StartsWith(contentRoot, StringComparison.OrdinalIgnoreCase))
                    return caminhoCompleto;

                if (!string.IsNullOrWhiteSpace(_environment.WebRootPath))
                {
                    var webRoot = Path.GetFullPath(_environment.WebRootPath);
                    if (caminhoCompleto.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase))
                        return caminhoCompleto;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Falha ao normalizar o caminho legado '{Caminho}'.", caminho);
            }

            return string.Empty;
        }

        private bool EhUrlLocalLegada(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return false;

            if (!Uri.TryCreate(url, UriKind.Absolute, out var absoluteUri))
                return true;

            if (absoluteUri.IsFile)
                return true;

            if (absoluteUri.Scheme != Uri.UriSchemeHttp && absoluteUri.Scheme != Uri.UriSchemeHttps)
                return false;

            if (EhUrlBlob(url))
                return false;

            var caminho = absoluteUri.AbsolutePath;
            return PrefixosUrlLocal.Any(prefixo =>
                caminho.StartsWith(prefixo, StringComparison.OrdinalIgnoreCase));
        }

        private bool EhUrlBlob(string? url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return false;

            if (_blobServiceUri != null &&
                string.Equals(uri.Host, _blobServiceUri.Host, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return uri.Host.Contains(".blob.", StringComparison.OrdinalIgnoreCase);
        }

        private string ResolverNomeArquivo(
            string? nomeArquivoDeclarado,
            string? origem,
            string? contentType,
            string nomeBaseFallback)
        {
            var candidatos = new[]
            {
                nomeArquivoDeclarado,
                origem
            };

            foreach (var candidato in candidatos)
            {
                var nomeArquivo = Path.GetFileName(candidato?.Trim());
                if (!string.IsNullOrWhiteSpace(nomeArquivo) &&
                    !ProdutoMidiaHelper.EhDataUrl(nomeArquivo))
                {
                    return nomeArquivo;
                }
            }

            var extensao = ResolverExtensao(contentType);
            return $"{nomeBaseFallback}{extensao}";
        }

        private string ResolverContentType(string? contentTypeDeclarado, string nomeArquivo)
        {
            if (!string.IsNullOrWhiteSpace(contentTypeDeclarado))
                return contentTypeDeclarado.Trim();

            if (_contentTypeProvider.TryGetContentType(nomeArquivo, out var contentType))
                return contentType;

            return "application/octet-stream";
        }

        private string ResolverExtensao(string? contentType)
        {
            return contentType?.Trim().ToLowerInvariant() switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                "video/mp4" => ".mp4",
                "video/webm" => ".webm",
                "video/ogg" => ".ogg",
                "video/quicktime" => ".mov",
                _ => ".bin"
            };
        }

        private string ObterContainerProduto(TipoMidiaProduto tipo)
        {
            return tipo == TipoMidiaProduto.Video
                ? _blobStorageOptions.VideoProdutoContainerName
                : _blobStorageOptions.FotoProdutoContainerName;
        }

        private bool BlobStorageConfigurado()
        {
            if (string.IsNullOrWhiteSpace(_blobStorageOptions.ConnectionString))
                return false;

            return !_blobStorageOptions.ConnectionString.Contains("DEFINA_", StringComparison.OrdinalIgnoreCase) &&
                   !_blobStorageOptions.ConnectionString.Contains("SEU_", StringComparison.OrdinalIgnoreCase);
        }

        private static Uri? TryCriarBlobServiceUri(string? connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString) ||
                connectionString.Contains("DEFINA_", StringComparison.OrdinalIgnoreCase) ||
                connectionString.Contains("SEU_", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            try
            {
                return new BlobServiceClient(connectionString).Uri;
            }
            catch
            {
                return null;
            }
        }

        private readonly record struct ArquivoLegado(string NomeArquivo, string ContentType, byte[] Conteudo);
    }

    public class LegacyImageMigrationResult
    {
        public bool Ignorado { get; set; }
        public string? MotivoIgnorado { get; set; }
        public int FotosPerfilUsuarioMigradas { get; set; }
        public int MidiasProdutoMigradas { get; set; }
        public int FotosPerfilLojaMigradas { get; set; }
        public List<string> Pendencias { get; } = [];

        public int TotalMigrado =>
            FotosPerfilUsuarioMigradas +
            MidiasProdutoMigradas +
            FotosPerfilLojaMigradas;

        public void AdicionarPendencia(string origem, string? url, string motivo)
        {
            var referencia = string.IsNullOrWhiteSpace(url) ? "(sem URL)" : url.Trim();
            Pendencias.Add($"{origem}: {motivo} Referencia: {referencia}.");
        }
    }
}
