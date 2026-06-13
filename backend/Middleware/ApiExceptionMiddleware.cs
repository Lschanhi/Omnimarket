using System.Data.Common;

namespace Omnimarket.Api.Middleware;

public sealed class ApiExceptionMiddleware(
    RequestDelegate next,
    ILogger<ApiExceptionMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var databaseUnavailable = HasException<DbException>(exception);
        var statusCode = databaseUnavailable
            ? StatusCodes.Status503ServiceUnavailable
            : StatusCodes.Status500InternalServerError;
        var mensagem = databaseUnavailable
            ? "A API nao conseguiu acessar o banco de dados no momento. Verifique a conectividade do Azure SQL e tente novamente."
            : "Ocorreu um erro interno ao processar a solicitacao.";

        if (databaseUnavailable)
        {
            logger.LogWarning(
                exception,
                "Falha de banco de dados ao processar {Method} {Path}. TraceId: {TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);
        }
        else
        {
            logger.LogError(
                exception,
                "Falha nao tratada ao processar {Method} {Path}. TraceId: {TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";

        await context.Response.WriteAsJsonAsync(new
        {
            mensagem,
            traceId = context.TraceIdentifier,
            detalhe = environment.IsDevelopment() ? exception.Message : null,
        });
    }

    private static bool HasException<TException>(Exception? exception)
        where TException : Exception
    {
        for (var current = exception; current != null; current = current.InnerException)
        {
            if (current is TException)
            {
                return true;
            }
        }

        return false;
    }
}
