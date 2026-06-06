using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Models.Dtos.Uploads;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Services.Interfaces;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class ArquivoUploadService
    {
        private const int TamanhoMaximoFotoPerfilEmBytes = 2 * 1024 * 1024;

        private readonly IArquivoStorageService _arquivoStorageService;
        private readonly AzureBlobStorageOptions _blobStorageOptions;
        private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();

        public ArquivoUploadService(
            IArquivoStorageService arquivoStorageService,
            IOptions<AzureBlobStorageOptions> blobStorageOptions)
        {
            _arquivoStorageService = arquivoStorageService;
            _blobStorageOptions = blobStorageOptions.Value;
        }

        public Task<ArquivoUploadLeituraDto> UploadFotoPerfilUsuarioAsync(
            int usuarioId,
            IFormFile arquivo,
            CancellationToken cancellationToken = default)
        {
            return UploadImagemAsync(
                arquivo,
                _blobStorageOptions.FotoPerfilContainerName,
                $"usuarios/{usuarioId}/perfil",
                TamanhoMaximoFotoPerfilEmBytes,
                "foto-perfil",
                "Envie uma imagem valida para a foto de perfil.",
                "A foto de perfil deve ter no maximo 2 MB.",
                cancellationToken);
        }

        public Task<ArquivoUploadLeituraDto> UploadFotoPerfilLojaAsync(
            int usuarioId,
            IFormFile arquivo,
            CancellationToken cancellationToken = default)
        {
            return UploadImagemAsync(
                arquivo,
                _blobStorageOptions.FotoPerfilLojaContainerName,
                $"lojas/usuarios/{usuarioId}/perfil",
                TamanhoMaximoFotoPerfilEmBytes,
                "foto-perfil-loja",
                "Envie uma imagem valida para a foto de perfil da loja.",
                "A foto de perfil da loja deve ter no maximo 2 MB.",
                cancellationToken);
        }

        public async Task<List<ProdutoMidiaUploadLeituraDto>> UploadMidiasProdutoAsync(
            int usuarioId,
            List<IFormFile> arquivos,
            CancellationToken cancellationToken = default)
        {
            if (arquivos is null || arquivos.Count == 0)
                throw new InvalidOperationException("Envie ao menos 1 arquivo.");

            if (arquivos.Count > ProdutoMidiaHelper.QuantidadeMaximaMidiasPorOperacao)
            {
                throw new InvalidOperationException(
                    $"Envie no maximo {ProdutoMidiaHelper.QuantidadeMaximaMidiasPorOperacao} arquivos por vez.");
            }

            var resultados = new List<ProdutoMidiaUploadLeituraDto>();

            foreach (var arquivo in arquivos)
            {
                if (arquivo.Length == 0)
                    continue;

                if (arquivo.Length > ProdutoMidiaHelper.TamanhoMaximoMidiaEmBytes)
                {
                    throw new InvalidOperationException(
                        $"O arquivo {arquivo.FileName} ultrapassa o limite de 15 MB.");
                }

                var tipo = ProdutoMidiaHelper.DeterminarTipoMidia(
                    arquivo.ContentType,
                    arquivo.FileName,
                    $"O arquivo {arquivo.FileName} nao possui formato suportado.");
                var nomeArquivo = ProdutoMidiaHelper.SanitizarNomeArquivo(arquivo.FileName, tipo);
                var mimeType = ResolverMimeType(arquivo.ContentType, nomeArquivo);

                using var memoryStream = new MemoryStream();
                await arquivo.CopyToAsync(memoryStream, cancellationToken);
                memoryStream.Position = 0;

                var urlBlob = await _arquivoStorageService.SalvarAsync(
                    ObterContainerProduto(tipo),
                    $"produtos/usuarios/{usuarioId}/uploads",
                    nomeArquivo,
                    mimeType,
                    memoryStream,
                    cancellationToken);

                resultados.Add(new ProdutoMidiaUploadLeituraDto
                {
                    Tipo = tipo,
                    Url = urlBlob,
                    NomeArquivo = nomeArquivo,
                    MimeType = mimeType,
                    TamanhoBytes = arquivo.Length
                });
            }

            if (resultados.Count == 0)
                throw new InvalidOperationException("Nenhum arquivo valido foi enviado.");

            return resultados;
        }

        private async Task<ArquivoUploadLeituraDto> UploadImagemAsync(
            IFormFile arquivo,
            string containerName,
            string diretorio,
            long tamanhoMaximoEmBytes,
            string nomeArquivoPadrao,
            string mensagemArquivoInvalido,
            string mensagemTamanhoInvalido,
            CancellationToken cancellationToken)
        {
            if (arquivo is null || arquivo.Length == 0)
                throw new InvalidOperationException(mensagemArquivoInvalido);

            if (arquivo.Length > tamanhoMaximoEmBytes)
                throw new InvalidOperationException(mensagemTamanhoInvalido);

            var nomeArquivo = Path.GetFileName(arquivo.FileName?.Trim());
            if (string.IsNullOrWhiteSpace(nomeArquivo))
                nomeArquivo = nomeArquivoPadrao;

            var mimeType = ResolverMimeType(arquivo.ContentType, nomeArquivo);
            if (!mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(mensagemArquivoInvalido);

            using var memoryStream = new MemoryStream();
            await arquivo.CopyToAsync(memoryStream, cancellationToken);
            memoryStream.Position = 0;

            var urlBlob = await _arquivoStorageService.SalvarAsync(
                containerName,
                diretorio,
                nomeArquivo,
                mimeType,
                memoryStream,
                cancellationToken);

            return new ArquivoUploadLeituraDto
            {
                Url = urlBlob,
                NomeArquivo = nomeArquivo,
                MimeType = mimeType,
                TamanhoBytes = arquivo.Length
            };
        }

        private string ObterContainerProduto(TipoMidiaProduto tipo)
        {
            return tipo == TipoMidiaProduto.Video
                ? _blobStorageOptions.VideoProdutoContainerName
                : _blobStorageOptions.FotoProdutoContainerName;
        }

        private string ResolverMimeType(string? mimeTypeInformado, string nomeArquivo)
        {
            var mimeType = mimeTypeInformado?.Trim();
            if (!string.IsNullOrWhiteSpace(mimeType))
                return mimeType;

            if (_contentTypeProvider.TryGetContentType(nomeArquivo, out var mimeTypeInferido))
                return mimeTypeInferido;

            return "application/octet-stream";
        }
    }
}
