namespace Omnimarket.Api.Tests.Support;

internal sealed class ServiceTestFixture : IDisposable
{
    private int _sequencia = 1;

    public const string SenhaPadrao = "Senha@123";

    public DataContext Context { get; }
    public FakeArquivoStorageService ArquivoStorageService { get; }
    public ArquivoUploadService ArquivoUploadService { get; }
    public AuthService AuthService { get; }
    public AvaliacaoProdutoService AvaliacaoProdutoService { get; }
    public CarrinhoService CarrinhoService { get; }
    public ComissaoMarketplaceService ComissaoMarketplaceService { get; }
    public EnderecoService EnderecoService { get; }
    public FinanceiroService FinanceiroService { get; }
    public LojaService LojaService { get; }
    public PedidoService PedidoService { get; }
    public ProdutoService ProdutoService { get; }
    public ProdutoMidiaService ProdutoMidiaService { get; }
    public ReciboPedidoService ReciboPedidoService { get; }
    public SolicitacaoCancelamentoService SolicitacaoCancelamentoService { get; }
    public TelefoneService TelefoneService { get; }
    public UsuarioPerfilService UsuarioPerfilService { get; }

    public ServiceTestFixture(string? databaseName = null, string jwtExpireMinutes = "60")
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        var options = new DbContextOptionsBuilder<DataContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .ConfigureWarnings(configuracao => configuracao.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        Context = new DataContext(options);
        Context.Database.EnsureCreated();

        GarantirCadastrosFinanceirosBasicos();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "super-chave-de-teste-com-32-caracteres",
                ["Jwt:Issuer"] = "Omnimarket.Tests",
                ["Jwt:Audience"] = "Omnimarket.Tests.Client",
                ["Jwt:ExpireMinutes"] = jwtExpireMinutes
            })
            .Build();

        var tokenService = new TokenService(configuration);
        var gatewayPagamentoService = new GatewayPagamentoFakeService();
        ArquivoStorageService = new FakeArquivoStorageService();
        var blobStorageOptions = Microsoft.Extensions.Options.Options.Create(new AzureBlobStorageOptions
        {
            FotoPerfilContainerName = "foto-perfil-test",
            FotoProdutoContainerName = "foto-produto-test",
            VideoProdutoContainerName = "videos-produto-test",
            FotoPerfilLojaContainerName = "foto-perfil-loja-test"
        });

        AvaliacaoProdutoService = new AvaliacaoProdutoService(Context);
        AuthService = new AuthService(Context, tokenService);
        ArquivoUploadService = new ArquivoUploadService(ArquivoStorageService, blobStorageOptions);
        CarrinhoService = new CarrinhoService(Context);
        ComissaoMarketplaceService = new ComissaoMarketplaceService(Context);
        EnderecoService = new EnderecoService(Context);
        FinanceiroService = new FinanceiroService(
            Context,
            ComissaoMarketplaceService,
            gatewayPagamentoService);
        LojaService = new LojaService(Context, ArquivoStorageService, blobStorageOptions);
        PedidoService = new PedidoService(
            Context,
            FinanceiroService,
            ComissaoMarketplaceService);
        ProdutoMidiaService = new ProdutoMidiaService(Context, ArquivoStorageService, blobStorageOptions);
        ProdutoService = new ProdutoService(Context, ArquivoStorageService, blobStorageOptions);
        ReciboPedidoService = new ReciboPedidoService(Context);
        SolicitacaoCancelamentoService = new SolicitacaoCancelamentoService(Context, FinanceiroService);
        TelefoneService = new TelefoneService(Context);
        UsuarioPerfilService = new UsuarioPerfilService(Context, ArquivoStorageService, blobStorageOptions);
    }

    public void Dispose()
    {
        Context.Dispose();
    }

    public UsuarioRegistroComContatoDto CriarRegistroUsuarioDto(string nomeBase = "usuario")
    {
        var sequencia = _sequencia++;
        var identificador = NormalizarPrefixo(nomeBase);

        return new UsuarioRegistroComContatoDto
        {
            Cpf = GerarCpfValido(sequencia),
            Nome = $"{identificador} {sequencia}",
            Sobrenome = "Teste",
            Email = $"{identificador}{sequencia}@teste.com",
            Password = SenhaPadrao,
            ConfirmPassword = SenhaPadrao,
            AceitouTermos = true,
            Telefones =
            [
                new UsuarioTelefoneDto
                {
                    Ddd = "11",
                    Numero = "987654321",
                    IsPrincipal = true
                }
            ],
            Enderecos =
            [
                new UsuarioEnderecoDto
                {
                    TipoLogradouro = TiposLogradouroBR.Rua,
                    NomeEndereco = $"Rua {identificador} {sequencia}",
                    Numero = "100",
                    Complemento = "Casa",
                    Cep = "01001000",
                    Cidade = "Sao Paulo",
                    Uf = "SP",
                    IsPrincipal = true
                }
            ]
        };
    }

    public async Task<Usuario> CriarUsuarioAsync(string nomeBase = "usuario", string role = "User")
    {
        var sequencia = _sequencia++;
        var identificador = NormalizarPrefixo(nomeBase);

        Criptografia.CriarPasswordHash(SenhaPadrao, out var hash, out var salt);

        var usuario = new Usuario
        {
            Cpf = GerarCpfValido(sequencia),
            Nome = $"{identificador} {sequencia}",
            Sobrenome = "Teste",
            Email = $"{identificador}{sequencia}@teste.com",
            PasswordHash = hash,
            PasswordSalt = salt,
            AceitouTermos = true,
            DataAceiteTermos = DateTime.UtcNow,
            DataCadastro = DateTime.UtcNow,
            Role = role
        };

        Context.TBL_USUARIO.Add(usuario);
        await Context.SaveChangesAsync();

        return usuario;
    }

    public async Task<Endereco> CriarEnderecoAsync(int usuarioId, bool principal = true, bool ativo = true)
    {
        var endereco = new Endereco
        {
            UsuarioId = usuarioId,
            TipoLogradouro = TiposLogradouroBR.Rua,
            NomeEndereco = "Rua das Flores",
            Numero = "123",
            Complemento = "Apto 1",
            Cep = "01001000",
            Cidade = "Sao Paulo",
            Uf = "SP",
            IsPrincipal = principal,
            Ativo = ativo
        };

        Context.TBL_ENDERECO.Add(endereco);
        await Context.SaveChangesAsync();

        return endereco;
    }

    public async Task<Telefone> CriarTelefoneAsync(int usuarioId, bool principal = true, string numeroE164 = "+5511987654321")
    {
        var telefone = new Telefone
        {
            UsuarioId = usuarioId,
            NumeroE164 = numeroE164,
            IsPrincipal = principal
        };

        Context.TBL_TELEFONE.Add(telefone);
        await Context.SaveChangesAsync();

        return telefone;
    }

    public async Task<Loja> CriarLojaAsync(
        int usuarioId,
        bool ativa = true,
        string? nomeFantasia = null,
        bool criarOpcaoRetiradaPadrao = true)
    {
        var sequencia = _sequencia++;
        var nomeBase = string.IsNullOrWhiteSpace(nomeFantasia) ? $"Loja {sequencia}" : nomeFantasia.Trim();
        var usuario = await Context.TBL_USUARIO.SingleAsync(u => u.Id == usuarioId);
        var enderecoLoja = await CriarEnderecoAsync(usuarioId, principal: false);
        var telefoneLoja = await CriarTelefoneAsync(usuarioId, principal: false, numeroE164: $"+55119{sequencia:D8}");

        var loja = new Loja
        {
            UsuarioId = usuarioId,
            NomeFantasia = nomeBase,
            TipoDocumentoFiscal = TipoDocumentoFiscalLoja.CPF,
            DocumentoFiscal = usuario.Cpf,
            Descricao = "Loja criada para teste automatizado.",
            EmailContato = $"loja{usuarioId}{sequencia}@teste.com",
            EnderecoId = enderecoLoja.Id,
            TelefoneId = telefoneLoja.Id,
            Ativa = ativa,
            DtCriacao = DateTimeOffset.UtcNow
        };

        Context.TBL_LOJA.Add(loja);
        await Context.SaveChangesAsync();

        if (criarOpcaoRetiradaPadrao)
        {
            await CriarOpcaoEntregaLojaAsync(
                loja.Id,
                tipoEntregaId: (int)TipoEntrega.Retirada,
                nome: "Retirada na loja",
                valorFrete: 0,
                prazoEntregaDias: 0);
        }

        return loja;
    }

    public async Task<LojaEntregaOpcao> CriarOpcaoEntregaLojaAsync(
        int lojaId,
        int tipoEntregaId = (int)TipoEntrega.Retirada,
        string? nome = null,
        decimal valorFrete = 0,
        int prazoEntregaDias = 0,
        bool ativa = true)
    {
        var opcao = new LojaEntregaOpcao
        {
            LojaId = lojaId,
            TipoEntregaId = tipoEntregaId,
            Nome = nome ?? EntregaHelper.ObterNomeTipoEntrega(tipoEntregaId),
            ValorFrete = EntregaHelper.TipoEntregaEhRetirada(tipoEntregaId) ? 0 : valorFrete,
            PrazoEntregaDias = prazoEntregaDias,
            Ativa = ativa,
            DataCriacao = DateTime.UtcNow
        };

        Context.TBL_LOJA_ENTREGA_OPCAO.Add(opcao);
        await Context.SaveChangesAsync();

        return opcao;
    }

    public async Task<Produto> CriarProdutoAsync(
        int vendedorId,
        decimal preco = 50m,
        int estoque = 10,
        StatusProduto status = StatusProduto.Publicado)
    {
        var sequencia = _sequencia++;
        var loja = await Context.TBL_LOJA.FirstOrDefaultAsync(l => l.UsuarioId == vendedorId);

        if (loja == null)
            loja = await CriarLojaAsync(vendedorId);

        var produto = new Produto
        {
            LojaId = loja.Id,
            Loja = loja,
            Nome = $"Produto {sequencia}",
            Categoria = "Teste",
            Preco = preco,
            Estoque = estoque,
            Descricao = "Produto usado para teste automatizado.",
            StatusPublicacao = status,
            DtCriacao = DateTimeOffset.UtcNow
        };

        Context.TBL_PRODUTO.Add(produto);
        await Context.SaveChangesAsync();

        return produto;
    }

    public async Task<PedidoPendenteScenario> CriarPedidoPendenteAsync(
        int quantidade = 1,
        decimal preco = 50m,
        int estoque = 10)
    {
        var vendedor = await CriarUsuarioAsync("vendedor");
        var comprador = await CriarUsuarioAsync("comprador");
        var loja = await CriarLojaAsync(vendedor.Id);
        var opcaoEntrega = await CriarOpcaoEntregaLojaAsync(
            loja.Id,
            tipoEntregaId: (int)TipoEntrega.EntregaLocal,
            nome: "Entrega local teste",
            valorFrete: 0,
            prazoEntregaDias: 2);
        var endereco = await CriarEnderecoAsync(comprador.Id);
        var produto = await CriarProdutoAsync(vendedor.Id, preco, estoque);

        var pedido = await PedidoService.CriarPedido(
            comprador.Id,
            new PedidoDto
            {
                EnderecoId = endereco.Id,
                TipoEntregaId = opcaoEntrega.TipoEntregaId,
                Observacao = "Pedido de teste",
                Itens =
                [
                    new ItemPedidoDto
                    {
                        ProdutoId = produto.Id,
                        Quantidade = quantidade
                    }
                ]
            });

        return new PedidoPendenteScenario(
            comprador.Id,
            vendedor.Id,
            endereco.Id,
            produto.Id,
            pedido.Id,
            pedido.ValorTotalPedido,
            estoque,
            quantidade);
    }

    public async Task<PedidoPagoScenario> CriarPedidoPagoAsync(
        int quantidade = 1,
        decimal preco = 50m,
        int estoque = 10)
    {
        var pedidoPendente = await CriarPedidoPendenteAsync(quantidade, preco, estoque);

        var inicioPagamento = await FinanceiroService.IniciarPagamentoAsync(
            pedidoPendente.CompradorId,
            new IniciarPagamentoDto
            {
                PedidoId = pedidoPendente.PedidoId,
                FormaPagamentoId = 1
            });

        await FinanceiroService.ConfirmarPagamentoFakeAsync(
            pedidoPendente.CompradorId,
            inicioPagamento.PlanoPagamentoId);

        return new PedidoPagoScenario(
            pedidoPendente.CompradorId,
            pedidoPendente.VendedorId,
            pedidoPendente.EnderecoId,
            pedidoPendente.ProdutoId,
            pedidoPendente.PedidoId,
            inicioPagamento.PlanoPagamentoId,
            pedidoPendente.TotalPedido,
            pedidoPendente.EstoqueInicial,
            pedidoPendente.Quantidade);
    }

    public async Task<PedidoEntregueScenario> CriarPedidoEntregueAsync(
        int quantidade = 1,
        decimal preco = 50m,
        int estoque = 10)
    {
        var pedidoPago = await CriarPedidoPagoAsync(quantidade, preco, estoque);

        await PedidoService.MarcarPedidoComoEnviadoAsync(pedidoPago.PedidoId);
        await PedidoService.ConfirmarEntregaPedidoAsync(pedidoPago.PedidoId, pedidoPago.CompradorId);

        return new PedidoEntregueScenario(
            pedidoPago.CompradorId,
            pedidoPago.VendedorId,
            pedidoPago.EnderecoId,
            pedidoPago.ProdutoId,
            pedidoPago.PedidoId,
            pedidoPago.PlanoPagamentoId,
            pedidoPago.TotalPedido,
            pedidoPago.EstoqueInicial,
            pedidoPago.Quantidade);
    }

    public async Task<PedidoPagoMultilojaScenario> CriarPedidoPagoMultilojaAsync(
        int quantidadeProdutoA = 1,
        decimal precoProdutoA = 50m,
        int estoqueProdutoA = 10,
        int quantidadeProdutoB = 1,
        decimal precoProdutoB = 70m,
        int estoqueProdutoB = 10)
    {
        var vendedorA = await CriarUsuarioAsync("vendedor-a");
        var vendedorB = await CriarUsuarioAsync("vendedor-b");
        var comprador = await CriarUsuarioAsync("comprador");
        var endereco = await CriarEnderecoAsync(comprador.Id);

        await CriarLojaAsync(vendedorA.Id, nomeFantasia: "Loja A");
        await CriarLojaAsync(vendedorB.Id, nomeFantasia: "Loja B");

        var produtoA = await CriarProdutoAsync(vendedorA.Id, precoProdutoA, estoqueProdutoA);
        var produtoB = await CriarProdutoAsync(vendedorB.Id, precoProdutoB, estoqueProdutoB);

        var pedido = await PedidoService.CriarPedido(
            comprador.Id,
            new PedidoDto
            {
                EnderecoId = endereco.Id,
                TipoEntregaId = (int)TipoEntrega.EntregaLocal,
                Observacao = "Pedido multiloja de teste",
                Itens =
                [
                    new ItemPedidoDto
                    {
                        ProdutoId = produtoA.Id,
                        Quantidade = quantidadeProdutoA
                    },
                    new ItemPedidoDto
                    {
                        ProdutoId = produtoB.Id,
                        Quantidade = quantidadeProdutoB
                    }
                ]
            });

        var inicioPagamento = await FinanceiroService.IniciarPagamentoAsync(
            comprador.Id,
            new IniciarPagamentoDto
            {
                PedidoId = pedido.Id,
                FormaPagamentoId = 1
            });

        await FinanceiroService.ConfirmarPagamentoFakeAsync(
            comprador.Id,
            inicioPagamento.PlanoPagamentoId);

        var lojaAId = await Context.TBL_LOJA
            .Where(l => l.UsuarioId == vendedorA.Id)
            .Select(l => l.Id)
            .SingleAsync();

        var lojaBId = await Context.TBL_LOJA
            .Where(l => l.UsuarioId == vendedorB.Id)
            .Select(l => l.Id)
            .SingleAsync();

        return new PedidoPagoMultilojaScenario(
            comprador.Id,
            vendedorA.Id,
            vendedorB.Id,
            lojaAId,
            lojaBId,
            produtoA.Id,
            produtoB.Id,
            pedido.Id,
            inicioPagamento.PlanoPagamentoId,
            estoqueProdutoA,
            estoqueProdutoB,
            quantidadeProdutoA,
            quantidadeProdutoB);
    }

    private void GarantirCadastrosFinanceirosBasicos()
    {
        if (!Context.TBL_FORMA_PAGAMENTO.Any())
        {
            Context.TBL_FORMA_PAGAMENTO.AddRange(
                new FormaPagamento
                {
                    Id = 1,
                    Nome = "Pix",
                    Ativo = true,
                    DataCriacao = DateTime.UtcNow,
                    Observacao = "Pagamento instantaneo."
                },
                new FormaPagamento
                {
                    Id = 2,
                    Nome = "Dinheiro",
                    Ativo = true,
                    DataCriacao = DateTime.UtcNow,
                    Observacao = "Pagamento em dinheiro."
                },
                new FormaPagamento
                {
                    Id = 3,
                    Nome = "Cartao de Debito",
                    Ativo = true,
                    DataCriacao = DateTime.UtcNow,
                    Observacao = "Pagamento em cartao de debito."
                },
                new FormaPagamento
                {
                    Id = 4,
                    Nome = "Cartao de Credito",
                    Ativo = true,
                    DataCriacao = DateTime.UtcNow,
                    Observacao = "Pagamento em cartao."
                });
        }

        Context.SaveChanges();
    }

    private static string NormalizarPrefixo(string valor)
    {
        var texto = new string(valor
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());

        return string.IsNullOrWhiteSpace(texto) ? "usuario" : texto;
    }

    public string GerarCnpjValidoParaTeste()
    {
        return GerarCnpjValido(_sequencia++);
    }

    private static string GerarCpfValido(int sequencia)
    {
        var noveDigitos = (100000000 + (sequencia % 899999999)).ToString("D9");
        var numeros = noveDigitos.Select(c => c - '0').ToArray();

        var somaPrimeiroDigito = 0;
        for (int i = 0; i < 9; i++)
        {
            somaPrimeiroDigito += numeros[i] * (10 - i);
        }

        var restoPrimeiroDigito = somaPrimeiroDigito % 11;
        var primeiroDigito = restoPrimeiroDigito < 2 ? 0 : 11 - restoPrimeiroDigito;

        var somaSegundoDigito = 0;
        for (int i = 0; i < 9; i++)
        {
            somaSegundoDigito += numeros[i] * (11 - i);
        }

        somaSegundoDigito += primeiroDigito * 2;

        var restoSegundoDigito = somaSegundoDigito % 11;
        var segundoDigito = restoSegundoDigito < 2 ? 0 : 11 - restoSegundoDigito;

        return $"{noveDigitos}{primeiroDigito}{segundoDigito}";
    }

    private static string GerarCnpjValido(int sequencia)
    {
        var raiz = $"{(10000000 + (sequencia % 89999999)):D8}0001";
        var multiplicador1 = new[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        var multiplicador2 = new[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        var primeiroDigito = CalcularDigitoCnpj(raiz, multiplicador1);
        var segundoDigito = CalcularDigitoCnpj(raiz + primeiroDigito, multiplicador2);

        return $"{raiz}{primeiroDigito}{segundoDigito}";
    }

    private static int CalcularDigitoCnpj(string valor, IReadOnlyList<int> multiplicadores)
    {
        var soma = 0;

        for (var i = 0; i < multiplicadores.Count; i++)
            soma += (valor[i] - '0') * multiplicadores[i];

        var resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}

internal sealed record PedidoPendenteScenario(
    int CompradorId,
    int VendedorId,
    int EnderecoId,
    int ProdutoId,
    int PedidoId,
    decimal TotalPedido,
    int EstoqueInicial,
    int Quantidade);

internal sealed record PedidoPagoScenario(
    int CompradorId,
    int VendedorId,
    int EnderecoId,
    int ProdutoId,
    int PedidoId,
    int PlanoPagamentoId,
    decimal TotalPedido,
    int EstoqueInicial,
    int Quantidade);

internal sealed record PedidoEntregueScenario(
    int CompradorId,
    int VendedorId,
    int EnderecoId,
    int ProdutoId,
    int PedidoId,
    int PlanoPagamentoId,
    decimal TotalPedido,
    int EstoqueInicial,
    int Quantidade);

internal sealed record PedidoPagoMultilojaScenario(
    int CompradorId,
    int VendedorAId,
    int VendedorBId,
    int LojaAId,
    int LojaBId,
    int ProdutoAId,
    int ProdutoBId,
    int PedidoId,
    int PlanoPagamentoId,
    int EstoqueInicialProdutoA,
    int EstoqueInicialProdutoB,
    int QuantidadeProdutoA,
    int QuantidadeProdutoB);

internal sealed class FakeArquivoStorageService : IArquivoStorageService
{
    public List<string> ArquivosSalvos { get; } = [];
    public List<string> ArquivosRemovidos { get; } = [];

    public Task<string> SalvarAsync(
        string containerName,
        string diretorio,
        string nomeArquivo,
        string contentType,
        Stream conteudo,
        CancellationToken cancellationToken = default)
    {
        var url = $"https://storage.test/{containerName.Trim('/')}/{diretorio.Trim('/')}/{Guid.NewGuid():N}-{Uri.EscapeDataString(nomeArquivo)}";
        ArquivosSalvos.Add(url);
        return Task.FromResult(url);
    }

    public Task RemoverAsync(string? urlArquivo, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(urlArquivo))
            ArquivosRemovidos.Add(urlArquivo);

        return Task.CompletedTask;
    }

    public bool UrlPertenceAoContainer(string? urlArquivo, string containerName)
    {
        if (!Uri.TryCreate(urlArquivo, UriKind.Absolute, out var arquivoUri))
            return false;

        var caminho = arquivoUri.AbsolutePath
            .Trim('/')
            .Split('/', StringSplitOptions.RemoveEmptyEntries);

        return caminho.Length > 1 &&
            string.Equals(caminho[0], containerName.Trim('/'), StringComparison.OrdinalIgnoreCase);
    }
}
