using Microsoft.AspNetCore.Builder;
using Omnimarket.Api.Middleware;

namespace Omnimarket.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseApiExceptionHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ApiExceptionMiddleware>();
    }
}
