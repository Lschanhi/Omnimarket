using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Omnimarket.Api.Data;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Models.Dtos.Produtos;
using Omnimarket.Api.Models.Dtos.Produtos.Midias;
using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Models.Enum;
using Omnimarket.Api.Services.Interfaces;
using Omnimarket.Api.Utils;
using System.Globalization;
using System.Text;

namespace Omnimarket.Api.Services
{
    public class ProdutoService : IProdutoService
    {
        private readonly DataContext _context;
        private readonly IArquivoStorageService _arquivoStorageService;
        private readonly AzureBlobStorageOptions _blobStorageOptions;
        private const string TipoAlteracaoEdicaoDados = "EdicaoDados";
        private const string TipoAlteracaoStatusPublicacao = "AtualizacaoStatusPublicacao";
        private const string TipoAlteracaoEstoque = "AtualizacaoEstoque";
        private const string TipoAlteracaoDesativacao = "DesativacaoLogica";
        private const string TipoAlteracaoDesativacaoCategoria = "DesativacaoCategoria";
        private const string MensagemMidiaInvalida = "Formato de midia invalido para o produto.";

        public ProdutoService(
            DataContext context,
            IArquivoStorageService arquivoStorageService,
            IOptions<AzureBlobStorageOptions> blobStorageOptions)
        {
            _context = context;
            _arquivoStorageService = arquivoStorageService;
            _blobStorageOptions = blobStorageOptions.Value;
        }

        public async Task<IEnumerable<ProdutoLeituraDto>> GetAllAsync()
        {
            var produtos = await BaseQuery()
                .AsNoTracking()
                .Where(p =>
                    p.Loja.Ativa &&
                    p.StatusPublicacao == StatusProduto.Publicado &&
                    p.Estoque > 0)
                .OrderByDescending(p => p.DtCriacao)
                .ThenBy(p => p.Nome)
                .ToListAsync();

            return produtos.Select(MapToDto).ToList();
        }

        public async Task<IEnumerable<ProdutoLeituraDto>> GetHighlightsAsync(int take = 10)
        {
            var limite = NormalizarLimite(take);

            var produtos = await BaseQuery()
                .AsNoTracking()
                .Where(p =>
                    p.Loja.Ativa &&
                    p.StatusPublicacao == StatusProduto.Publicado &&
                    p.Estoque > 0)
                .OrderByDescending(p => p.TotalVisualizacoes)
                .ThenByDescending(p => p.TotalAvaliacoes)
                .ThenByDescending(p => p.MediaAvaliacao)
                .ThenByDescending(p => p.Estoque)
                .ThenByDescending(p => p.DtCriacao)
                .Take(limite)
                .ToListAsync();

            return produtos.Select(MapToDto).ToList();
        }

        public async Task<ProdutoLeituraDto?> GetByIdAsync(int id, bool registrarVisualizacao = false)
        {
            var query = BaseQuery();

            if (!registrarVisualizacao)
                query = query.AsNoTracking();

            var produto = await query
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.Loja.Ativa &&
                    p.StatusPublicacao == StatusProduto.Publicado);

            if (produto == null)
                return null;

            if (registrarVisualizacao)
            {
                produto.TotalVisualizacoes += 1;
                produto.UltimaVisualizacaoEm = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();
            }

            return MapToDto(produto);
        }

        public async Task<ProdutoLeituraDto> CreateAsync(ProdutoCriacaoDto dto, int usuarioId)
        {
            var loja = await _context.TBL_LOJA
                .FirstOrDefaultAsync(l => l.UsuarioId == usuarioId);

            if (loja == null)
                throw new Exception("Crie uma loja antes de cadastrar produtos.");

            if (!loja.Ativa)
                throw new Exception("Sua loja precisa estar ativa para cadastrar produtos.");

            var produto = new Produto
            {
                Nome = NormalizarTextoObrigatorio(dto.Nome, "Informe um nome valido para o produto."),
                Categoria = NormalizarTextoObrigatorio(dto.Categoria, "Informe uma categoria valida para o produto."),
                Preco = dto.Preco,
                Estoque = dto.Estoque,
                Descricao = LimparOpcional(dto.Descricao),
                StatusPublicacao = dto.StatusPublicacao,
                LojaId = loja.Id,
                Loja = loja,
                DtCriacao = DateTimeOffset.UtcNow
            };

            await AdicionarImagensAsync(produto, dto.Imagens, $"produtos/lojas/{loja.Id}/catalogo");
            _context.TBL_PRODUTO.Add(produto);
            await _context.SaveChangesAsync();

            return MapToDto(produto);
        }

        public async Task<bool> UpdateAsync(int id, ProdutoAtualizarDto dto, int usuarioId)
        {
            var produto = await _context.TBL_PRODUTO
                .Include(p => p.Loja)
                .Include(p => p.Midias)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (produto == null)
                return false;

            if (produto.Loja.UsuarioId != usuarioId)
                throw new UnauthorizedAccessException("Voce nao pode editar este produto.");

            if (produto.StatusPublicacao == StatusProduto.Desativado)
                throw new Exception("Produto desativado nao pode ser alterado pelo editar comum.");

            var nomeNormalizado = dto.Nome != null
                ? NormalizarTextoObrigatorio(dto.Nome, "Informe um nome valido para o produto.")
                : produto.Nome;

            var categoriaNormalizada = dto.Categoria != null
                ? NormalizarTextoObrigatorio(dto.Categoria, "Informe uma categoria valida para o produto.")
                : produto.Categoria;

            var descricaoNormalizada = dto.Descricao != null
                ? LimparOpcional(dto.Descricao)
                : produto.Descricao;

            var statusPublicacaoSolicitado = ResolverStatusPublicacaoAtualizado(dto);

            if (statusPublicacaoSolicitado.HasValue && !Enum.IsDefined(typeof(StatusProduto), statusPublicacaoSolicitado.Value))
                throw new Exception("Status de publicacao invalido para o produto.");

            if (statusPublicacaoSolicitado == StatusProduto.Desativado)
                throw new Exception("Use a exclusao do produto para desativar permanentemente o produto.");

            var alterouNome = dto.Nome != null && produto.Nome != nomeNormalizado;
            var alterouCategoria = dto.Categoria != null && produto.Categoria != categoriaNormalizada;
            var alterouPreco = dto.Preco.HasValue && produto.Preco != dto.Preco.Value;
            var alterouEstoque = dto.Estoque.HasValue && produto.Estoque != dto.Estoque.Value;
            var alterouDescricao = dto.Descricao != null && produto.Descricao != descricaoNormalizada;
            var alterouStatusPublicacao = statusPublicacaoSolicitado.HasValue &&
                produto.StatusPublicacao != statusPublicacaoSolicitado.Value;
            var alterouImagens = dto.Imagens != null;

            if (!alterouNome &&
                !alterouCategoria &&
                !alterouPreco &&
                !alterouEstoque &&
                !alterouDescricao &&
                !alterouStatusPublicacao &&
                !alterouImagens)
                return true;

            decimal? precoAnterior = alterouPreco ? produto.Preco : null;
            decimal? precoNovo = alterouPreco ? dto.Preco!.Value : null;
            int? estoqueAnterior = alterouEstoque ? produto.Estoque : null;
            int? estoqueNovo = alterouEstoque ? dto.Estoque!.Value : null;
            var descricaoAnterior = alterouDescricao ? produto.Descricao : null;
            var descricaoNova = alterouDescricao ? descricaoNormalizada : null;

            if (alterouNome)
                produto.Nome = nomeNormalizado;

            if (alterouCategoria)
                produto.Categoria = categoriaNormalizada;

            if (alterouPreco)
                produto.Preco = dto.Preco!.Value;

            if (alterouEstoque)
                produto.Estoque = dto.Estoque!.Value;

            if (dto.Descricao != null)
                produto.Descricao = descricaoNormalizada;

            if (alterouStatusPublicacao)
                produto.StatusPublicacao = statusPublicacaoSolicitado!.Value;

            List<string> urlsFotosRemovidas = [];
            if (dto.Imagens != null)
                urlsFotosRemovidas = await SincronizarImagensAsync(produto, dto.Imagens);

            var dataAlteracao = DateTimeOffset.UtcNow;
            produto.DtAtualizacao = dataAlteracao;

            RegistrarHistoricoProduto(
                produto,
                usuarioId,
                DefinirTipoAlteracaoEdicao(
                    alterouNome,
                    alterouCategoria,
                    alterouPreco,
                    alterouEstoque,
                    alterouDescricao,
                    alterouStatusPublicacao,
                    alterouImagens),
                dataAlteracao,
                precoAnterior: precoAnterior,
                precoNovo: precoNovo,
                estoqueAnterior: estoqueAnterior,
                estoqueNovo: estoqueNovo,
                descricaoAnterior: descricaoAnterior,
                descricaoNova: descricaoNova);

            await _context.SaveChangesAsync();

            foreach (var urlFotoRemovida in urlsFotosRemovidas)
                await _arquivoStorageService.RemoverAsync(urlFotoRemovida);

            return true;
        }

        public async Task<bool> AtualizarEstoqueAsync(int id, ProdutoAtualizarEstoqueDto dto, int usuarioId)
        {
            var produto = await _context.TBL_PRODUTO
                .Include(p => p.Loja)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (produto == null)
                return false;

            if (produto.Loja.UsuarioId != usuarioId)
                throw new UnauthorizedAccessException("Voce nao pode alterar o estoque deste produto.");

            if (produto.StatusPublicacao == StatusProduto.Desativado)
                throw new Exception("Produto desativado nao pode ter estoque alterado.");

            if (produto.Estoque == dto.Estoque)
                return true;

            var estoqueAnterior = produto.Estoque;
            produto.Estoque = dto.Estoque;
            var dataAlteracao = DateTimeOffset.UtcNow;
            produto.DtAtualizacao = dataAlteracao;

            RegistrarHistoricoProduto(
                produto,
                usuarioId,
                TipoAlteracaoEstoque,
                dataAlteracao,
                estoqueAnterior: estoqueAnterior,
                estoqueNovo: dto.Estoque);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id, int usuarioId)
        {
            var produto = await _context.TBL_PRODUTO
                .Include(p => p.Loja)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (produto == null)
                return false;

            if (produto.Loja.UsuarioId != usuarioId)
                throw new UnauthorizedAccessException("Voce nao pode excluir este produto.");

            if (produto.StatusPublicacao == StatusProduto.Desativado)
                return true;

            DesativarProdutoLogicamente(produto, usuarioId, TipoAlteracaoDesativacao, DateTimeOffset.UtcNow);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<CategoriaExclusaoResultadoDto> DeleteCategoryAsync(
            string categoria,
            int usuarioId,
            bool confirmarExclusaoProdutos)
        {
            var categoriaNormalizada = NormalizarTextoObrigatorio(
                categoria,
                "Informe uma categoria valida para excluir.");

            var loja = await _context.TBL_LOJA
                .FirstOrDefaultAsync(l => l.UsuarioId == usuarioId);

            if (loja == null)
                throw new InvalidOperationException("Crie uma loja antes de gerenciar categorias.");

            var categoriaChave = CriarChaveCategoria(categoriaNormalizada);
            var produtosCategoria = await _context.TBL_PRODUTO
                .Where(p =>
                    p.LojaId == loja.Id &&
                    p.StatusPublicacao != StatusProduto.Desativado)
                .ToListAsync();

            var produtosParaDesativar = produtosCategoria
                .Where(p => CriarChaveCategoria(p.Categoria) == categoriaChave)
                .ToList();

            if (produtosParaDesativar.Count == 0)
            {
                return new CategoriaExclusaoResultadoDto
                {
                    Categoria = categoriaNormalizada,
                    TotalProdutosEncontrados = 0,
                    TotalProdutosDesativados = 0,
                    RequerConfirmacao = false,
                    Mensagem = "Nenhum produto ativo foi encontrado nessa categoria."
                };
            }

            if (!confirmarExclusaoProdutos)
            {
                return new CategoriaExclusaoResultadoDto
                {
                    Categoria = categoriaNormalizada,
                    TotalProdutosEncontrados = produtosParaDesativar.Count,
                    TotalProdutosDesativados = 0,
                    RequerConfirmacao = true,
                    Mensagem = produtosParaDesativar.Count == 1
                        ? "Esta categoria possui 1 produto ativo. Confirme para desativar a categoria e o produto vinculado."
                        : $"Esta categoria possui {produtosParaDesativar.Count} produtos ativos. Confirme para desativar a categoria e todos os produtos vinculados."
                };
            }

            var dataAlteracao = DateTimeOffset.UtcNow;

            foreach (var produto in produtosParaDesativar)
                DesativarProdutoLogicamente(produto, usuarioId, TipoAlteracaoDesativacaoCategoria, dataAlteracao);

            await _context.SaveChangesAsync();

            return new CategoriaExclusaoResultadoDto
            {
                Categoria = categoriaNormalizada,
                TotalProdutosEncontrados = produtosParaDesativar.Count,
                TotalProdutosDesativados = produtosParaDesativar.Count,
                RequerConfirmacao = false,
                Mensagem = produtosParaDesativar.Count == 1
                    ? "Categoria removida com sucesso. 1 produto foi desativado."
                    : $"Categoria removida com sucesso. {produtosParaDesativar.Count} produtos foram desativados."
            };
        }

        public async Task<PageResult<ProdutoLeituraDto>> GetPagedAsync(ProdutoFiltroDto filtro)
        {
            var page = filtro.Page < 1 ? 1 : filtro.Page;
            var pageSize = filtro.PageSize < 1 ? 10 : filtro.PageSize;
            pageSize = pageSize > 50 ? 50 : pageSize;

            var query = BaseQuery()
                .Where(p => p.Loja.Ativa);

            if (filtro.StatusPublicacao.HasValue)
                query = query.Where(p => p.StatusPublicacao == filtro.StatusPublicacao.Value);
            else
                query = query.Where(p => p.StatusPublicacao == StatusProduto.Publicado);

            if (!string.IsNullOrWhiteSpace(filtro.Nome))
            {
                var like = $"%{filtro.Nome.Trim()}%";
                query = query.Where(p => EF.Functions.Like(p.Nome, like));
            }

            if (!string.IsNullOrWhiteSpace(filtro.Categoria))
            {
                var like = $"%{filtro.Categoria.Trim()}%";
                query = query.Where(p => EF.Functions.Like(p.Categoria, like));
            }

            if (filtro.LojaId.HasValue)
                query = query.Where(p => p.LojaId == filtro.LojaId.Value);

            if (filtro.PrecoMinimo.HasValue)
                query = query.Where(p => p.Preco >= filtro.PrecoMinimo.Value);

            if (filtro.PrecoMaximo.HasValue)
                query = query.Where(p => p.Preco <= filtro.PrecoMaximo.Value);

            if (filtro.Disponivel.HasValue)
            {
                if (filtro.Disponivel.Value)
                    query = query.Where(p => p.StatusPublicacao == StatusProduto.Publicado && p.Estoque > 0);
                else
                    query = query.Where(p => p.StatusPublicacao != StatusProduto.Publicado || p.Estoque <= 0);
            }

            var total = await query.CountAsync();
            var produtos = await query
                .OrderByDescending(p => p.DtCriacao)
                .ThenBy(p => p.Nome)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PageResult<ProdutoLeituraDto>
            {
                Items = produtos.Select(MapToDto).ToList(),
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        private IQueryable<Produto> BaseQuery()
        {
            return _context.TBL_PRODUTO
                .Include(p => p.Midias)
                .Include(p => p.Loja)
                .AsQueryable();
        }

        private static int NormalizarLimite(int take, int padrao = 10, int maximo = 20)
        {
            if (take <= 0)
                return padrao;

            return take > maximo ? maximo : take;
        }

        private async Task<List<string>> SincronizarImagensAsync(Produto produto, IEnumerable<string> imagens)
        {
            var entradasMidia = NormalizarImagens(imagens).ToList();
            var fotosAtuais = produto.Midias
                .Where(m => m.Tipo == TipoMidiaProduto.Foto)
                .ToList();
            var urlsFotosRemovidas = fotosAtuais
                .Select(m => m.Url)
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .ToList();

            if (fotosAtuais.Count > 0)
            {
                _context.ProdutoMidia.RemoveRange(fotosAtuais);
                foreach (var foto in fotosAtuais)
                    produto.Midias.Remove(foto);
            }

            var midiasNaoFoto = produto.Midias
                .Where(m => m.Tipo != TipoMidiaProduto.Foto)
                .OrderBy(m => m.Ordem)
                .ToList();

            for (var index = 0; index < midiasNaoFoto.Count; index++)
                midiasNaoFoto[index].Ordem = entradasMidia.Count + index;

            await AdicionarImagensAsync(produto, entradasMidia);
            return urlsFotosRemovidas;
        }

        private async Task AdicionarImagensAsync(
            Produto produto,
            IEnumerable<string>? imagens,
            string? diretorioBase = null)
        {
            var entradasMidia = NormalizarImagens(imagens).ToList();
            if (entradasMidia.Count == 0)
                return;

            if (entradasMidia.Count > ProdutoMidiaHelper.QuantidadeMaximaMidiasPorOperacao)
            {
                throw new InvalidOperationException(
                    $"Envie no maximo {ProdutoMidiaHelper.QuantidadeMaximaMidiasPorOperacao} midias por operacao.");
            }

            var ordemInicial = produto.Midias.Any() ? produto.Midias.Max(m => m.Ordem) + 1 : 0;

            for (var index = 0; index < entradasMidia.Count; index++)
            {
                produto.Midias.Add(await CriarMidiaProdutoAsync(
                    entradasMidia[index],
                    ordemInicial + index,
                    diretorioBase ?? $"produtos/{produto.Id}/catalogo"));
            }
        }

        private static IEnumerable<string> NormalizarImagens(IEnumerable<string>? imagens)
        {
            if (imagens == null)
                return Array.Empty<string>();

            return imagens
                .Select(url => url?.Trim())
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Cast<string>()
                .ToList();
        }

        private async Task<ProdutoMidia> CriarMidiaProdutoAsync(
            string entradaMidia,
            int ordem,
            string diretorioBase)
        {
            if (ProdutoMidiaHelper.EhDataUrl(entradaMidia))
            {
                var (mimeType, conteudo) = ProdutoMidiaHelper.ConverterDataUrl(entradaMidia, MensagemMidiaInvalida);

                if (conteudo.Length > ProdutoMidiaHelper.TamanhoMaximoMidiaEmBytes)
                    throw new InvalidOperationException("Cada midia do produto deve ter no maximo 15 MB.");

                var tipo = ProdutoMidiaHelper.DeterminarTipoMidia(mimeType, null, MensagemMidiaInvalida);
                var nomeArquivo = ProdutoMidiaHelper.SanitizarNomeArquivo(null, tipo);

                await using var memoryStream = new MemoryStream(conteudo);
                var urlBlob = await _arquivoStorageService.SalvarAsync(
                    ObterContainerProduto(tipo),
                    diretorioBase,
                    nomeArquivo,
                    mimeType,
                    memoryStream);

                return new ProdutoMidia
                {
                    Tipo = tipo,
                    Url = urlBlob,
                    ContentType = mimeType,
                    NomeArquivo = nomeArquivo,
                    Conteudo = null,
                    Ordem = ordem
                };
            }

            if (!ProdutoMidiaHelper.EhUrlHttpOuHttpsAbsoluta(entradaMidia))
            {
                throw new InvalidOperationException(
                    "Use uma URL absoluta publicada para a midia do produto ou envie o arquivo em data URL.");
            }

            var uriMidia = new Uri(entradaMidia, UriKind.Absolute);
            var caminhoArquivo = Uri.UnescapeDataString(uriMidia.AbsolutePath);
            var tipoLegado = ProdutoMidiaHelper.DeterminarTipoMidia(null, caminhoArquivo, MensagemMidiaInvalida);
            var nomeArquivoUrl = Path.GetFileName(caminhoArquivo);

            return new ProdutoMidia
            {
                Tipo = tipoLegado,
                Url = uriMidia.ToString(),
                ContentType = null,
                NomeArquivo = ProdutoMidiaHelper.SanitizarNomeArquivo(nomeArquivoUrl, tipoLegado),
                Conteudo = null,
                Ordem = ordem
            };
        }

        private string ObterContainerProduto(TipoMidiaProduto tipo)
        {
            return tipo == TipoMidiaProduto.Video
                ? _blobStorageOptions.VideoProdutoContainerName
                : _blobStorageOptions.FotoProdutoContainerName;
        }

        private static string NormalizarTextoObrigatorio(string? valor, string mensagemErro)
        {
            if (string.IsNullOrWhiteSpace(valor))
                throw new Exception(mensagemErro);

            return valor.Trim();
        }

        private static string? LimparOpcional(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            return valor.Trim();
        }

        private static StatusProduto? ResolverStatusPublicacaoAtualizado(ProdutoAtualizarDto dto)
        {
            if (dto.StatusPublicacao.HasValue)
                return dto.StatusPublicacao.Value;

            if (dto.Disponivel.HasValue)
                return dto.Disponivel.Value ? StatusProduto.Publicado : StatusProduto.Pausado;

            return null;
        }

        private static string DefinirTipoAlteracaoEdicao(
            bool alterouNome,
            bool alterouCategoria,
            bool alterouPreco,
            bool alterouEstoque,
            bool alterouDescricao,
            bool alterouStatusPublicacao,
            bool alterouImagens)
        {
            return !alterouNome &&
                !alterouCategoria &&
                !alterouPreco &&
                !alterouEstoque &&
                !alterouDescricao &&
                alterouStatusPublicacao &&
                !alterouImagens
                ? TipoAlteracaoStatusPublicacao
                : TipoAlteracaoEdicaoDados;
        }

        private void DesativarProdutoLogicamente(
            Produto produto,
            int usuarioId,
            string tipoAlteracao,
            DateTimeOffset dataAlteracao)
        {
            produto.StatusPublicacao = StatusProduto.Desativado;
            produto.DtAtualizacao = dataAlteracao;

            RegistrarHistoricoProduto(
                produto,
                usuarioId,
                tipoAlteracao,
                dataAlteracao,
                precoAnterior: produto.Preco,
                precoNovo: produto.Preco,
                estoqueAnterior: produto.Estoque,
                estoqueNovo: produto.Estoque,
                descricaoAnterior: produto.Descricao,
                descricaoNova: produto.Descricao);
        }

        private static string CriarChaveCategoria(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return string.Empty;

            var textoNormalizado = valor.Trim().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(textoNormalizado.Length);

            foreach (var caractere in textoNormalizado)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(caractere) != UnicodeCategory.NonSpacingMark)
                    builder.Append(char.ToLowerInvariant(caractere));
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        private void RegistrarHistoricoProduto(
            Produto produto,
            int usuarioId,
            string tipoAlteracao,
            DateTimeOffset dataAlteracao,
            decimal? precoAnterior = null,
            decimal? precoNovo = null,
            int? estoqueAnterior = null,
            int? estoqueNovo = null,
            string? descricaoAnterior = null,
            string? descricaoNova = null)
        {
            _context.TBL_HISTORICO_PRODUTO.Add(new HistoricoProduto
            {
                ProdutoId = produto.Id,
                LojaId = produto.LojaId,
                UsuarioResponsavelId = usuarioId,
                TipoAlteracao = tipoAlteracao,
                NomeProdutoSnapshot = produto.Nome,
                CategoriaProdutoSnapshot = produto.Categoria,
                PrecoAnterior = precoAnterior,
                PrecoNovo = precoNovo,
                EstoqueAnterior = estoqueAnterior,
                EstoqueNovo = estoqueNovo,
                DescricaoAnterior = descricaoAnterior,
                DescricaoNova = descricaoNova,
                DataAlteracao = dataAlteracao
            });
        }

        private static ProdutoLeituraDto MapToDto(Produto produto)
        {
            var midiasOrdenadas = produto.Midias
                .OrderBy(m => m.Ordem)
                .ToList();

            return new ProdutoLeituraDto
            {
                Id = produto.Id,
                Nome = produto.Nome,
                Categoria = produto.Categoria,
                Preco = produto.Preco,
                Estoque = produto.Estoque,
                Disponivel = produto.Disponivel,
                StatusPublicacao = produto.StatusPublicacao,
                Descricao = produto.Descricao,
                MediaAvaliacao = produto.MediaAvaliacao,
                TotalAvaliacoes = produto.TotalAvaliacoes,
                TotalVisualizacoes = produto.TotalVisualizacoes,
                DtCriacao = produto.DtCriacao,
                DtAtualizacao = produto.DtAtualizacao,
                LojaId = produto.LojaId,
                NomeLoja = produto.Loja != null ? produto.Loja.NomeFantasia : string.Empty,
                Imagens = midiasOrdenadas
                    .Where(m => m.Tipo == TipoMidiaProduto.Foto)
                    .Select(ProdutoMidiaHelper.ObterUrlLeitura)
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .ToList(),
                Midias = midiasOrdenadas
                    .Select(ProdutoMidiaService.MapearMidia)
                    .ToList()
            };
        }
    }
}
