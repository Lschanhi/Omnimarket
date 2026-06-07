FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY OmniMarket.API.csproj ./
RUN dotnet restore OmniMarket.API.csproj

COPY . ./
RUN dotnet publish OmniMarket.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish ./
COPY render-entrypoint.sh ./render-entrypoint.sh

RUN chmod +x ./render-entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["./render-entrypoint.sh"]
