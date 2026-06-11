using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Omnimarket.Api.Models.Configuracoes;
using Omnimarket.Api.Data;
using Omnimarket.Api.Services;
using Omnimarket.Api.Services.Interfaces;
using Omnimarket.Api.Utils;
using QuestPDF.Infrastructure;


var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Permite sobreposicao local de segredos sem versionar no repositorio.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

var runningOnRender = string.Equals(
    builder.Configuration["RENDER"],
    "true",
    StringComparison.OrdinalIgnoreCase);

var (connectionStringName, connectionString) = ConnectionStringResolver.Resolve(
    builder.Configuration,
    builder.Environment.IsDevelopment());

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) ||
    jwtKey.Contains("DEFINA_", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Configure Jwt:Key em appsettings.Local.json, User Secrets ou variavel de ambiente.");
}

// Chave usada para assinar e validar os tokens JWT da aplicacao.
var key = Encoding.UTF8.GetBytes(jwtKey);

// Evita problemas de permissao em ambiente local mantendo as chaves de DataProtection no proprio projeto.
var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, ".dataprotection-keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath));

if (runningOnRender)
{
    // No Render o HTTPS termina no proxy, entao a API precisa confiar
    // nos headers encaminhados para evitar loops de redirecionamento.
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

// Registra o contexto do Entity Framework apontando para o banco SQL Server.
builder.Services.AddDbContext<DataContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        );
    });
});

// Configura a autenticacao da API para usar JWT em todos os endpoints protegidos.
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        RequireExpirationTime = false,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            try
            {
                var principal = context.Principal;

                if (principal == null)
                {
                    context.Fail("Token de autenticacao invalido.");
                    return;
                }

                var usuarioId = principal.GetUserId();
                var sessaoVersao = principal.GetSessionVersion();
                var authService = context.HttpContext.RequestServices.GetRequiredService<AuthService>();

                if (!await authService.SessaoEstaAtivaAsync(usuarioId, sessaoVersao))
                {
                    context.Fail("Sessao encerrada. Faca login novamente.");
                }
            }
            catch (Exception)
            {
                context.Fail("Token de autenticacao invalido.");
            }
        }
    };
});

// Permite usar a secao historica AzureBlobStorage em appsettings
// e a secao BlobStorage no App Service, evitando prefixos reservados da plataforma.
builder.Services.AddOptions<AzureBlobStorageOptions>()
    .Configure<IConfiguration>((options, configuration) =>
    {
        configuration.GetSection(AzureBlobStorageOptions.SectionName).Bind(options);
        configuration.GetSection(AzureBlobStorageOptions.AppServiceSectionName).Bind(options);
    });

// Servicos de negocio que serao injetados nos controllers.
    
builder.Services.AddScoped<IArquivoStorageService, AzureBlobStorageService>();
builder.Services.AddScoped<ArquivoUploadService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsuarioPerfilService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<PedidoService>();
builder.Services.AddScoped<SolicitacaoCancelamentoService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<AvaliacaoProdutoService>();
builder.Services.AddScoped<LojaService>();
builder.Services.AddScoped<LojaEntregaService>();
builder.Services.AddScoped<CarrinhoService>();
builder.Services.AddScoped<ProdutoMidiaService>();
builder.Services.AddScoped<EnderecoService>();
builder.Services.AddScoped<TelefoneService>();
builder.Services.AddScoped<IGatewayPagamentoService, GatewayPagamentoFakeService>();
builder.Services.AddScoped<ComissaoMarketplaceService>();
builder.Services.AddScoped<FinanceiroService>();
builder.Services.AddScoped<VendedorFinanceiroService>();
builder.Services.AddScoped<ReciboPedidoService>();
builder.Services.AddScoped<AdminDashboardService>();
builder.Services.AddScoped<AdminUsuarioService>();
builder.Services.AddScoped<AdminLojaService>();
builder.Services.AddScoped<AdminProdutoService>();
builder.Services.AddScoped<AdminPedidoService>();
builder.Services.AddScoped<AdminVendaService>();
builder.Services.AddScoped<LegacyImageMigrationService>();

// Permite complementar as origens autorizadas via appsettings/variavel de ambiente
// sem perder o conjunto padrao usado nos ambientes locais e publicados.
var defaultAllowedOrigins = new[]
{
    "http://localhost:5173",
    "https://localhost:5173",
    "http://127.0.0.1:5173",
    "https://127.0.0.1:5173",
    "https://omnimarket-web.azurewebsites.net",
    "https://omnimarket-web-prod.azurewebsites.net",
    "https://omnimarket-zeta.vercel.app"
};

var configuredAllowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

var allowedOrigins = defaultAllowedOrigins
    .Concat(configuredAllowedOrigins ?? Array.Empty<string>())
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendLocal", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Configura os controllers e serializa enums como texto no JSON.
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Swagger facilita a exploracao e o teste dos endpoints em desenvolvimento.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Informe o token JWT no formato: Bearer {seu_token}",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    options.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [jwtSecurityScheme] = Array.Empty<string>()
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.Logger.LogInformation("Usando a connection string '{ConnectionStringName}' para o DataContext.", connectionStringName);

if (args.Any(arg => string.Equals(arg, "--migrate-legacy-images", StringComparison.OrdinalIgnoreCase)))
{
    using var scope = app.Services.CreateScope();
    var migracaoService = scope.ServiceProvider.GetRequiredService<LegacyImageMigrationService>();
    var resultadoMigracao = await migracaoService.MigrarAsync();

    app.Logger.LogInformation(
        "Execucao manual da migracao de imagens finalizada. Total migrado: {TotalMigrado}. Pendencias: {Pendencias}. Ignorado: {Ignorado}.",
        resultadoMigracao.TotalMigrado,
        resultadoMigracao.Pendencias.Count,
        resultadoMigracao.Ignorado);

    return;
}

await AdminSeedService.AplicarAsync(app.Services);

using (var scope = app.Services.CreateScope())
{
    var blobStorageOptions = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AzureBlobStorageOptions>>().Value;
    if (blobStorageOptions.MigrateLegacyImagesOnStartup)
    {
        var migracaoService = scope.ServiceProvider.GetRequiredService<LegacyImageMigrationService>();
        await migracaoService.MigrarAsync();
    }
}

// Pipeline HTTP da aplicacao.
if (runningOnRender)
{
    app.UseForwardedHeaders();
}
else
{
    // O Render termina o HTTPS no proxy e encaminha o trafego ao container via HTTP.
    // Pular o redirecionamento interno evita falha no health check durante o deploy.
    app.UseHttpsRedirection();
}

app.UseCors("FrontendLocal");
app.UseAuthentication();
app.UseAuthorization();

var adminRootPath = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "admin");
if (Directory.Exists(adminRootPath))
{
    var adminFileProvider = new PhysicalFileProvider(adminRootPath);

    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = adminFileProvider,
        RequestPath = "/admin"
    });

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = adminFileProvider,
        RequestPath = "/admin"
    });
}



app.UseSwagger();
app.UseSwaggerUI();


// Health leve para o Render e para monitores externos.
// Nao depende do banco para evitar timeout no startup.
app.MapGet("/health", () =>
{
    return Results.Ok(new { status = "ok" });
});

// Health de diagnostico para validar conectividade com o banco quando necessario.
app.MapGet("/health/database", async (DataContext dataContext, CancellationToken cancellationToken) =>
{
    var bancoDisponivel = await dataContext.Database.CanConnectAsync(cancellationToken);

    return bancoDisponivel
        ? Results.Ok(new { status = "ok", database = "reachable" })
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
});

// Mapeia as rotas declaradas nos controllers.
app.MapControllers();

app.Run();
