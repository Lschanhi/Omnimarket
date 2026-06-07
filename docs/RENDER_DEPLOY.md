# Deploy da API no Render

Este repositorio agora inclui os arquivos necessarios para publicar a API no Render:

- `render.yaml`
- `backend/Dockerfile`
- `backend/render-entrypoint.sh`

## O que voce precisa saber antes

Esta API usa `Microsoft.EntityFrameworkCore.SqlServer`, entao ela espera um banco SQL Server. O Render nao oferece SQL Server gerenciado nativamente; por isso, o caminho mais simples e manter um banco externo, como:

- Azure SQL
- SQL Server em outra VPS
- SQL Server em outra nuvem

Se voce quiser usar banco gerenciado do proprio Render, isso exigiria migrar a aplicacao de SQL Server para Postgres, o que nao faz parte desta configuracao.

## Opcao 1: publicar com Blueprint

1. Suba este repositorio para o GitHub.
2. No Render, clique em `New` > `Blueprint`.
3. Selecione o repositorio.
4. O Render vai detectar o arquivo `render.yaml`.
5. Durante a criacao, preencha os campos marcados como secretos:
   - `ConnectionStrings__Default`
   - `BlobStorage__ConnectionString`
   - `Cors__AllowedOrigins__0`
6. Conclua a criacao do servico.

## Opcao 2: criar o Web Service manualmente

Se preferir criar sem Blueprint, use estas configuracoes no painel do Render:

- `Service Type`: `Web Service`
- `Runtime`: `Docker`
- `Root Directory`: `backend`
- `Dockerfile Path`: `./Dockerfile`
- `Docker Context`: `.`
- `Health Check Path`: `/health`

Variaveis de ambiente minimas:

- `ASPNETCORE_ENVIRONMENT=Production`
- `Database__ConnectionStringName=Default`
- `ConnectionStrings__Default=<sua connection string SQL Server>`
- `Jwt__Key=<chave forte com pelo menos 32 caracteres>`
- `Jwt__Issuer=OmniMarket.API`
- `Jwt__Audience=OmniMarket.API`
- `BlobStorage__ConnectionString=<connection string do Azure Blob>`
- `BlobStorage__FotoPerfilContainerName=foto-perfil`
- `BlobStorage__FotoProdutoContainerName=foto-produtos`
- `BlobStorage__VideoProdutoContainerName=videos-produtos`
- `BlobStorage__FotoPerfilLojaContainerName=foto-perfil-loja`
- `BlobStorage__MigrateLegacyImagesOnStartup=false`
- `Cors__AllowedOrigins__0=https://SUA-URL-DO-FRONTEND`

## Como validar depois do deploy

Depois que o servico subir:

1. Abra `https://SEU-SERVICO.onrender.com/health`
2. Confirme que a resposta retorna `200 OK`
3. Abra `https://SEU-SERVICO.onrender.com/swagger`
4. Teste um endpoint simples da API

## Banco de dados e migracoes

O deploy no Render nao aplica migracoes automaticamente nesta configuracao. Se o banco ainda nao estiver pronto, rode as migracoes apontando para o banco de producao antes do primeiro uso da API.

Exemplo local:

```powershell
dotnet ef database update --project backend/OmniMarket.API.csproj --startup-project backend/OmniMarket.API.csproj
```

## CORS

Se voce publicar o frontend em outro dominio, atualize `Cors__AllowedOrigins__0` com a URL exata desse frontend. Se precisar liberar mais de uma origem, adicione:

- `Cors__AllowedOrigins__1`
- `Cors__AllowedOrigins__2`

e assim por diante.
