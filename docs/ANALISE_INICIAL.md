# Analise inicial

## A. Estrutura atual encontrada

- O projeto original estava dividido em dois repositorios separados:
  - `Omnimarket.Api`: backend .NET com testes, migrations, SQL scripts, servicos de negocio e um admin estatico em `wwwroot/admin`.
  - `Omnimarket.Web`: frontend React/Vite com rotas, componentes, servicos HTTP e estado local.
- O novo workspace foi consolidado em:
  - `backend/`
  - `frontend/`
  - `docs/`

## B. Stack identificada

### Backend

- ASP.NET Core 9
- Entity Framework Core 9 com SQL Server
- JWT Bearer para autenticacao
- Swagger / OpenAPI
- Azure Blob Storage para arquivos
- QuestPDF para recibos PDF
- xUnit no projeto `Omnimarket.Api.Tests`

### Frontend

- React 19
- TypeScript
- Vite 8
- TanStack Router
- Zustand
- Tailwind CSS

## C. Como rodar localmente hoje

### Backend

1. Criar `backend/appsettings.Local.json` com uma connection string valida e JWT configurado.
2. Rodar:

```powershell
dotnet restore backend/Omnimarket.Api.sln
dotnet build backend/Omnimarket.Api.sln -v minimal
dotnet test backend/Omnimarket.Api.sln -v minimal
dotnet run --project backend/OmniMarket.API.csproj
```

### Frontend

1. Criar `frontend/.env.local` com `VITE_API_BASE_URL`.
2. Rodar:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

## D. Problemas ou riscos encontrados

1. O `backend/appsettings.json` original continha credenciais embutidas. Isso foi sanitizado no repositorio principal, mas indica risco de vazamento nos repositorios antigos.
2. O backend ativa `app.UseDeveloperExceptionPage()` sem checar ambiente, o que nao e adequado para producao.
3. A API ja expoe health checks basicos, mas ainda pode evoluir em monitoramento e observabilidade.
4. O frontend ainda nao possui testes automatizados nem script `npm test`.
5. A protecao de rotas do frontend nao esta centralizada no router. Hoje a autenticacao existe no client, mas o acesso por rota ainda depende de componentes/fluxos.
6. Existe sobreposicao de superficies administrativas: um admin estatico no backend e a aplicacao web React, o que pede uma decisao arquitetural futura.
7. Os workflows CI/CD dos repositorios originais ainda nao foram migrados para o repositorio principal.

## E. Arquivos sensiveis ou ausentes

### Nao devem ser versionados

- `backend/appsettings.Local.json`
- `backend/appsettings.*.Local.json`
- `backend/.dataprotection-keys/`
- `frontend/.env.local`
- `frontend/node_modules/`
- `frontend/dist/`
- `backend/bin/`
- `backend/obj/`

### Ausentes por design e precisam ser criados localmente

- `backend/appsettings.Local.json`
- `frontend/.env.local`

## F. Sugestao de estrutura final

```text
/
|-- backend/
|-- frontend/
|-- docs/
|-- .env.example
|-- .gitignore
|-- package.json
`-- README.md
```

## G. Plano de migracao ou evolucao

1. Consolidar codigo e documentacao no repositorio principal sem reaproveitar artefatos locais.
2. Sanitizar configuracoes e criar exemplos seguros de ambiente.
3. Validar build/testes atuais para garantir que a migracao estrutural nao quebrou o setup.
4. Consolidar CI/CD do GitHub para caminhos `backend/**` e `frontend/**`.
5. Enderecar dividas tecnicas mais arriscadas:
   - health check
   - guardas de rota no frontend
   - estrategia unica para admin
   - endurecimento do backend para producao

## H. Primeira entrega recomendada

Base do repositorio principal com:

- `backend/` e `frontend/` organizados
- README raiz
- `.gitignore` raiz
- exemplos de ambiente
- documentacao inicial
- validacao de build/lint/test onde for possivel

## I. Checklist QA inicial

- Backend compila
- Testes do backend passam
- Frontend instala dependencias sem erro
- Frontend faz build
- Frontend passa no lint
- Login responde token valido
- Cadastro e perfil de usuario carregam sem erro
- Listagem de produtos consulta a API configurada
- Carrinho, pedido e pagamento fake mantem fluxo basico
- Rotas administrativas seguem bloqueadas no backend por role `Admin`
