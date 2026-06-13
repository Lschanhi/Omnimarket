using System.Data.Common;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Omnimarket.Api.Middleware;

namespace Omnimarket.Api.Tests;

public class ApiExceptionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_QuandoRecebeDbException_Retorna503ComMensagemDeInfraestrutura()
    {
        var contexto = CriarContextoHttp();
        var middleware = new ApiExceptionMiddleware(
            _ => throw new FakeDbException("Falha ao conectar no banco."),
            NullLogger<ApiExceptionMiddleware>.Instance,
            new FakeHostEnvironment());

        await middleware.InvokeAsync(contexto);

        Assert.Equal(StatusCodes.Status503ServiceUnavailable, contexto.Response.StatusCode);

        var payload = await LerPayloadAsync(contexto);
        Assert.Equal(
            "A API nao conseguiu acessar o banco de dados no momento. Verifique a conectividade do Azure SQL e tente novamente.",
            payload.GetProperty("mensagem").GetString());
        Assert.Equal("trace-id-teste", payload.GetProperty("traceId").GetString());
        Assert.True(payload.TryGetProperty("detalhe", out _));
    }

    [Fact]
    public async Task InvokeAsync_QuandoRecebeExcecaoGenerica_Retorna500ComMensagemPadrao()
    {
        var contexto = CriarContextoHttp();
        var middleware = new ApiExceptionMiddleware(
            _ => throw new InvalidOperationException("Falha inesperada."),
            NullLogger<ApiExceptionMiddleware>.Instance,
            new FakeHostEnvironment());

        await middleware.InvokeAsync(contexto);

        Assert.Equal(StatusCodes.Status500InternalServerError, contexto.Response.StatusCode);

        var payload = await LerPayloadAsync(contexto);
        Assert.Equal(
            "Ocorreu um erro interno ao processar a solicitacao.",
            payload.GetProperty("mensagem").GetString());
        Assert.Equal("Falha inesperada.", payload.GetProperty("detalhe").GetString());
    }

    private static DefaultHttpContext CriarContextoHttp()
    {
        return new DefaultHttpContext
        {
            TraceIdentifier = "trace-id-teste",
            Response =
            {
                Body = new MemoryStream(),
            },
        };
    }

    private static async Task<JsonElement> LerPayloadAsync(DefaultHttpContext contexto)
    {
        contexto.Response.Body.Position = 0;
        using var document = await JsonDocument.ParseAsync(contexto.Response.Body);
        return document.RootElement.Clone();
    }

    private sealed class FakeHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "OmniMarket.API.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; }
            = new Microsoft.Extensions.FileProviders.NullFileProvider();
    }

    private sealed class FakeDbException(string message) : DbException(message);
}
