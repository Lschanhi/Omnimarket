# OmniMarket API

API principal do OmniMarket, responsavel por autenticacao, regras de negocio, persistencia, uploads e modulo administrativo.

## Stack

- ASP.NET Core 9
- Entity Framework Core 9
- SQL Server / Azure SQL
- JWT Bearer
- Swagger
- Azure Blob Storage
- QuestPDF

## Configuracao

1. Copie `appsettings.Local.example.json` para `appsettings.Local.json`.
2. Preencha:
   - `ConnectionStrings:Default`
   - `Jwt:Key`
   - configuracoes de Blob Storage, se necessario
   - `AdminSeed`, se quiser criar admin tecnico no ambiente local

O arquivo `appsettings.Local.json` nao deve ser versionado.

## Comandos

```powershell
dotnet restore Omnimarket.Api.sln
dotnet build Omnimarket.Api.sln -v minimal
dotnet test Omnimarket.Api.sln -v minimal
dotnet run --project OmniMarket.API.csproj
```

## Urls locais padrao

- `http://localhost:5033`
- `https://localhost:7030`

## Modulos principais

- autenticacao e sessao
- usuarios, enderecos e telefones
- lojas e entregas
- produtos, midias e avaliacoes
- carrinho, pedidos e cancelamentos
- financeiro e recibos
- admin

## Observacoes

- Swagger permanece habilitado para teste e exploracao.
- Existe uma interface administrativa estatica auxiliar em `wwwroot/admin`.
- Ainda e recomendavel adicionar health check e restringir `UseDeveloperExceptionPage()` por ambiente em uma proxima entrega.
