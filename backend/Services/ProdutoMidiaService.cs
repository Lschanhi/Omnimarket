using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Models.Dtos.Produtos.Midias;
using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Services.Interfaces;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class ProdutoMidiaService
    {
        private readonly DataContext _context;
        private readonly IArquivoStorageService _arquivoStorageService;
        private readonly AzureBlobStorageOptions _blobStorageOptions;

        public ProdutoMidiaService(
            DataContext context,
            IArquivoStorageService arquivoStorageService,
            IOptions<AzureBlobStorageOptions> blobStorageOptions)
        {
            _context = context;
            _arquivoStorageService = arquivoStorageService;
            _blobStorageOptions = blobStorageOptions.Value;
        }

        public async Task<List<ProdutoMidiaLeituraDto>> ListarAsync(int produtoId)
        {
            var midias = await _context.ProdutoMidia
                .Where(m => m.ProdutoId == produtoId)
                .OrderBy(m => m.Ordem)
                .ToListAsync();

            return midias.Select(MapearMidia).ToList();
        }

        public async Task<List<ProdutoMidiaLeituraDto>> UploadMidiasAsync(
            int produtoId,
            int usuarioId,
            List<IFormFile> arquivos)
        {
            if (arquivos is null || arquivos.Count == 0)
                throw new InvalidOperationException("Envie ao menos 1 arquivo.");

            if (arquivos.Count > ProdutoMidiaHelper.QuantidadeMaximaMidiasPorOperacao)
            {
                throw new InvalidOperationException(
                    $"Envie no maximo {ProdutoMidiaHelper.QuantidadeMaximaMidiasPorOperacao} arquivos por vez.");
            }

            var produto = await _context.TBL_PRODUTO
                .Include(p => p.Midias)
                .Include(p => p.Loja)
                .FirstOrDefaultAsync(p => p.Id == produtoId);

            if (produto == null)
                throw new KeyNotFoundException("Produto nao encontrado.");

            if (produto.Loja.UsuarioId != usuarioId)
                throw new UnauthorizedAccessException();

            var ordemAtual = produto.Midias.Any() ? produto.Midias.Max(m => m.Ordem) + 1 : 0;
            var novasMidias = new List<ProdutoMidia>();

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

                await using var memoryStream = new MemoryStream();
                await arquivo.CopyToAsync(memoryStream);
                var nomeArquivo = ProdutoMidiaHelper.SanitizarNomeArquivo(arquivo.FileName, tipo);
                var urlBlob = await _arquivoStorageService.SalvarAsync(
                    ObterContainerProduto(tipo),
                    $"produtos/{produtoId}/midias",
                    nomeArquivo,
                    arquivo.ContentType?.Trim() ?? "application/octet-stream",
                    memoryStream);

                novasMidias.Add(new ProdutoMidia
                {
                    ProdutoId = produtoId,
                Tipo = tipo,
                Url = urlBlob,
                    ContentType = arquivo.ContentType?.Trim(),
                    NomeArquivo = nomeArquivo,
                    Conteudo = null,
                    Ordem = ordemAtual++
                });
            }

            if (novasMidias.Count == 0)
                throw new InvalidOperationException("Nenhum arquivo valido foi enviado.");

            await _context.ProdutoMidia.AddRangeAsync(novasMidias);
            await _context.SaveChangesAsync();

            return novasMidias
                .OrderBy(m => m.Ordem)
                .Select(MapearMidia)
                .ToList();
        }

        private string ObterContainerProduto(TipoMidiaProduto tipo)
        {
            return tipo == TipoMidiaProduto.Video
                ? _blobStorageOptions.VideoProdutoContainerName
                : _blobStorageOptions.FotoProdutoContainerName;
        }

        public async Task RemoverAsync(int produtoId, int midiaId, int usuarioId)
        {
            var produto = await _context.TBL_PRODUTO
                .Include(p => p.Loja)
                .FirstOrDefaultAsync(p => p.Id == produtoId);

            if (produto == null)
                throw new KeyNotFoundException("Produto nao encontrado.");

            if (produto.Loja.UsuarioId != usuarioId)
                throw new UnauthorizedAccessException();

            var midia = await _context.ProdutoMidia
                .FirstOrDefaultAsync(m => m.Id == midiaId && m.ProdutoId == produtoId);

            if (midia == null)
                throw new KeyNotFoundException("Midia nao encontrada.");

            await _arquivoStorageService.RemoverAsync(midia.Url);
            _context.ProdutoMidia.Remove(midia);
            await _context.SaveChangesAsync();
        }

        public static ProdutoMidiaLeituraDto MapearMidia(ProdutoMidia midia)
        {
            return new ProdutoMidiaLeituraDto
            {
                Id = midia.Id,
                Tipo = midia.Tipo,
                Url = ProdutoMidiaHelper.ObterUrlLeitura(midia),
                ContentType = midia.ContentType,
                NomeArquivo = midia.NomeArquivo,
                Ordem = midia.Ordem
            };
        }
    }
}
