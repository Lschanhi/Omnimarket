# OmniMarket

Repositorio principal do OmniMarket com frontend, backend e documentacao no mesmo workspace.

## Estrutura

```text
/
|-- backend/   API .NET 9, EF Core, SQL Server, JWT, Swagger e servicos de negocio
|-- frontend/  React 19 + Vite + TypeScript + TanStack Router + Zustand
|-- docs/      Analise, arquitetura, RBAC, API e QA
|-- .env.example
|-- .gitignore
`-- package.json
```

## Stack atual

- Backend: ASP.NET Core 9, Entity Framework Core 9, SQL Server, JWT Bearer, Azure Blob Storage, QuestPDF, Swagger.
- Frontend: React 19, TypeScript, Vite 8, TanStack Router, Zustand, Tailwind CSS.
- Infra atual: SQL Server/Azure SQL, Azure App Service e Azure Blob Storage.

## Como rodar localmente

### 1. Configurar backend

1. Copie `backend/appsettings.Local.example.json` para `backend/appsettings.Local.json`.
2. Preencha a connection string, a chave JWT e, se necessario, configuracoes de Blob Storage e admin seed.
3. Opcionalmente, use variaveis de ambiente seguindo o modelo de `.env.example`.

Comandos:

```powershell
dotnet restore backend/Omnimarket.Api.sln
dotnet build backend/Omnimarket.Api.sln -v minimal
dotnet test backend/Omnimarket.Api.sln -v minimal
dotnet run --project backend/OmniMarket.API.csproj
```

Urls padrao do backend:

- `http://localhost:5033`
- `https://localhost:7030`

### 2. Configurar frontend

1. Copie `frontend/.env.example` para `frontend/.env.local`.
2. Ajuste `VITE_API_BASE_URL` para a URL local da API.

Comandos:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run lint
```

### 3. Scripts de conveniencia na raiz

```powershell
npm run frontend:install
npm run frontend:dev
npm run frontend:build
npm run frontend:lint
npm run backend:restore
npm run backend:build
npm run backend:test
npm run backend:run
```

## Documentacao

- `docs/ANALISE_INICIAL.md`
- `docs/ARQUITETURA.md`
- `docs/API.md`
- `docs/RBAC.md`
- `docs/QA_CHECKLIST.md`
- `docs/MANUAL_OPERACAO_APLICATIVO.md`
- `docs/MANUAL_DE_TESTE.md`
- `docs/PLANO_DE_TESTE.md`
- `docs/AZURE_APP_SERVICE_DEPLOY.md`
- `docs/RENDER_DEPLOY.md`

## Decisoes desta migracao

- Backend e frontend foram copiados para `backend/` e `frontend/` sem reaproveitar builds, `node_modules`, `bin`, `obj`, `.git` ou configs locais sensiveis.
- `backend/appsettings.json` foi sanitizado para remover credenciais embutidas.
- Foram adicionados exemplos seguros de ambiente para facilitar setup sem versionar segredos.

## Riscos tecnicos atuais

- O backend ainda usa `app.UseDeveloperExceptionPage()` sem condicao de ambiente.
- O frontend nao possui suite de testes automatizados nem script `npm test`.
- A protecao de rotas no frontend ainda nao esta centralizada por router/layout.
- A API ja expoe health checks, mas a observabilidade ainda pode evoluir com monitoramento e alertas.
- Os workflows de GitHub Actions dos repositorios originais ainda nao foram consolidados neste repositorio principal.

## Publicar em um unico repositorio GitHub

Se este workspace for o novo repositorio:

```powershell
git init
git add .
git commit -m "chore: estrutura inicial do omnimarket"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Se quiser preservar historico dos repositorios antigos, a proxima etapa recomendada e migrar com `git subtree` ou outra estrategia de importacao de historico antes do push final.

## Deploy automatico

Este repositorio ja inclui workflows separados para deploy automatico no Azure App Service:

- backend: `.github/workflows/deploy-backend-appservice.yml`
- frontend: `.github/workflows/deploy-frontend-appservice.yml`

As instrucoes de configuracao no GitHub e no Azure estao em `docs/AZURE_APP_SERVICE_DEPLOY.md`.

## Deploy no Render

O repositorio agora tambem inclui configuracao para publicar a API no Render com Docker:

- `render.yaml`
- `backend/Dockerfile`

O passo a passo completo esta em `docs/RENDER_DEPLOY.md`.
