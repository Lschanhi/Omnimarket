# Azure App Service Deploy

Este repositorio esta configurado para deploy automatico de:

- `backend/` -> Azure App Service da API
- `frontend/` -> Azure App Service da aplicacao web

Os workflows ficam em:

- `.github/workflows/deploy-backend-appservice.yml`
- `.github/workflows/deploy-frontend-appservice.yml`

## Como funciona

- Push em `main` alterando `backend/**` dispara o deploy da API.
- Push em `main` alterando `frontend/**` dispara o deploy do frontend.
- Ambos tambem podem ser executados manualmente com `workflow_dispatch`.

## Variaveis e secrets no GitHub

Configure em `Settings > Secrets and variables > Actions`.

### Repository variables

- `AZURE_WEBAPP_NAME_BACKEND`
  Exemplo: `omnimarket-api-prod`
- `AZURE_WEBAPP_NAME_FRONTEND`
  Exemplo: `omnimarket-web-prod`
- `VITE_API_BASE_URL_PRODUCTION`
  Exemplo: `https://omnimarket-api-prod.azurewebsites.net`

### Repository secrets

- `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND`
  Conteudo inteiro do publish profile do App Service da API.
- `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`
  Conteudo inteiro do publish profile do App Service do frontend.

## Onde pegar o publish profile

No Portal do Azure:

1. Abra o App Service.
2. Clique em `Get publish profile`.
3. Baixe o arquivo.
4. Copie o conteudo XML inteiro para o secret correspondente no GitHub.

## Configuracoes do App Service

### Backend

No App Service da API, configure `Application settings` com os valores reais de producao:

- `Database__ConnectionStringName=Default`
- `ConnectionStrings__Default=<connection string do Azure SQL>`
- `Jwt__Key=<chave forte>`
- `Jwt__Issuer=OmniMarket.API`
- `Jwt__Audience=OmniMarket.API`
- `BlobStorage__ConnectionString=<connection string do storage>`
- `BlobStorage__FotoPerfilContainerName=foto-perfil`
- `BlobStorage__FotoProdutoContainerName=foto-produtos`
- `BlobStorage__VideoProdutoContainerName=videos-produtos`
- `BlobStorage__FotoPerfilLojaContainerName=foto-perfil-loja`
- `Cors__AllowedOrigins__0=https://omnimarket-web-prod.azurewebsites.net`

No Azure SQL Server usado por essa connection string, confirme tambem a parte de rede:

- em `Networking`, habilite `Allow Azure services and resources to access this server` ou cadastre explicitamente os IPs de saida do App Service
- valide usuario, senha, nome do banco e servidor na connection string final publicada
- antes de testar a home, confira `https://SEU-BACKEND.azurewebsites.net/health/database`
  - `200` indica que a API alcancou o banco
  - `503` indica indisponibilidade do banco ou bloqueio de rede/firewall

### Frontend

O frontend usa `VITE_API_BASE_URL` em tempo de build. Por isso:

- a URL da API precisa estar correta em `VITE_API_BASE_URL_PRODUCTION`
- sempre que a URL da API mudar, rode novamente o workflow do frontend

## Observacoes importantes

1. O frontend atual esta preparado para App Service com SPA rewrite via `frontend/public/web.config`.
2. O backend e publicado como app .NET compilada.
3. Se quiser ambientes `staging` e `production`, a proxima evolucao natural e usar deployment slots e environments separados no GitHub.
