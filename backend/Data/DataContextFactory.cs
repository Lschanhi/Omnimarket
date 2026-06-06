using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Data
{
    // Factory usada pelo dotnet ef para criar o DbContext sem depender do host completo da API.
    public class DataContextFactory : IDesignTimeDbContextFactory<DataContext>
    {
        public DataContext CreateDbContext(string[] args)
        {
            var basePath = Directory.GetCurrentDirectory();

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddJsonFile("appsettings.Local.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var environmentName = configuration["ASPNETCORE_ENVIRONMENT"];
            var isDevelopment = string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase);
            var (_, connectionString) = ConnectionStringResolver.Resolve(configuration, isDevelopment);

            var optionsBuilder = new DbContextOptionsBuilder<DataContext>();
            optionsBuilder.UseSqlServer(connectionString);

            return new DataContext(optionsBuilder.Options);
        }
    }
}
